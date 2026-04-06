import { useState, useCallback, useEffect } from "react";
import { backofficeApi } from "../services/backofficeApi.js";
import { downloadCSV } from "../utils/exportUtils.js";
import { useSnackbar } from "../../../contexts/SnackbarContext.jsx";

/**
 * Hook personalizado para manejar la lógica de los reportes administrativos.
 * @param {string} currencySymbol - Símbolo de moneda.
 */
export function useReports(currencySymbol = "C$") {
  const snackbar = useSnackbar();
  const [activeReport, setActiveReport] = useState(null);
  const [range, setRange] = useState({ desde: "", hasta: "", top: 10 });
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  // Detalle de orden
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailOrder, setDetailOrder] = useState(null);

  const reportRange = {
    desde: range?.desde?.trim() || undefined,
    hasta: range?.hasta?.trim() || undefined,
  };

  const loadReportData = useCallback(async (reportId = activeReport) => {
    if (!reportId) return;
    setLoading(true);
    setError("");
    try {
      const query = reportRange;
      if (reportId === "ventas") {
        const [data, pedidos] = await Promise.all([
          backofficeApi.reportesResumenVentas(query),
          backofficeApi.reportesResumenVentasDetalle(query),
        ]);
        const details = Array.isArray(data?.desglosePorDia)
          ? data.desglosePorDia
          : data?.dias || [];
        const ordersItems = Array.isArray(pedidos?.items)
          ? pedidos.items
          : Array.isArray(pedidos)
          ? pedidos
          : [];
        
        setRows(details);
        setOrders(
          ordersItems.map((o, i) => ({
            key: `${o.origen || o.origenPedido || "order"}-${o.id || i}-${i}`,
            sourceId: o.id || o.Id || null,
            numero: o.numero || o.codigo || `#${1200 + i}`,
            fecha: o.fecha || o.fechaCreacion || o.createdAt || "",
            origen: o.origen || o.origenPedido || "-",
            referencia:
              o.mesa ||
              o.mesaNumero ||
              o.cliente ||
              o.clienteNombre ||
              (String(o.origen || o.origenPedido || "").toLowerCase() === "delivery"
                ? "Delivery"
                : "-"),
            vendedor: o.mesero || o.usuario || "-",
            monto: Number(o.monto ?? o.total ?? 0),
          }))
        );
        setSummary({
          totalVentas: data?.totalVentas ?? data?.total ?? 0,
          totalOrdenes: data?.totalOrdenes ?? data?.ordenes ?? 0,
          promedioTicket: data?.promedioTicket ?? data?.ticketPromedio ?? 0,
        });
      } else if (reportId === "productos-top") {
        const data = await backofficeApi.reportesProductosTop({
          ...reportRange,
          top: range.top || 10,
        });
        setRows(Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : []);
        setSummary(null);
      } else if (reportId === "vendedores") {
        const data = await backofficeApi.reportesVentasPorVendedor(reportRange);
        const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
        const result = items
          .map((r) => ({
            vendedorId: r.meseroId ?? r.MeseroId ?? null,
            vendedor: r.mesero || r.usuario || "Sin vendedor",
            ordenes: Number(r.ordenes ?? r.Ordenes ?? 0),
            venta: Number(r.totalVentas ?? r.total ?? r.venta ?? 0),
            promedioTicket: Number(r.promedioTicket ?? r.ticketPromedio ?? 0),
          }))
          .sort((a, b) => b.venta - a.venta);
        
        setRows(result);
        const tv = Number(data?.totalVentas ?? data?.total ?? result.reduce((s, r) => s + r.venta, 0));
        const to = Number(data?.totalOrdenes ?? data?.ordenes ?? result.reduce((s, r) => s + r.ordenes, 0));
        setSummary({
          totalVentas: tv,
          totalOrdenes: to,
          promedioTicket: Number(data?.promedioTicket ?? data?.ticketPromedio) || (to > 0 ? tv / to : 0),
        });
      } else if (reportId === "categorias") {
        const data = await backofficeApi.reportesVentasPorCategoria(reportRange);
        const cats = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
        setRows(cats);
        setSummary({
          totalVentas: cats.reduce((s, r) => s + Number(r.total || r.venta || 0), 0),
          totalOrdenes: 0,
          promedioTicket: 0,
        });
      } else if (reportId === "caja") {
        const data = await backofficeApi.cajaHistorial({ page: 1, pageSize: 100 });
        const items = Array.isArray(data?.items) ? data.items : [];
        const filtered = items.filter((x) => {
          const raw = x.fechaCierre || x.fecha || x.createdAt;
          if (!raw) return true;
          const d = new Date(raw);
          if (Number.isNaN(d.getTime())) return true;
          if (range.desde) {
            const f = new Date(`${range.desde}T00:00:00`);
            if (d < f) return false;
          }
          if (range.hasta) {
            const t = new Date(`${range.hasta}T23:59:59`);
            if (d > t) return false;
          }
          return true;
        });
        setRows(filtered);
        setSummary({
          totalVentas: filtered.reduce((s, r) => s + Number(r.totalVentas ?? r.total ?? 0), 0),
          totalOrdenes: filtered.length,
          promedioTicket: 0,
        });
      } else if (reportId === "movimientos") {
        const data = await backofficeApi.movimientosProductos(reportRange);
        setRows(Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : []);
        setSummary(null);
      }
    } catch (e) {
      setRows([]);
      setSummary(null);
      setError(e.message || "Error al cargar reporte.");
    } finally {
      setLoading(false);
    }
  }, [activeReport, range, reportRange]);

  const downloadExcel = async (reportId) => {
    setExporting(true);
    setError("");
    try {
      let data = [];
      let headers = [];
      const filename = `reporte-${reportId}-${new Date().toISOString().slice(0, 10)}.csv`;

      switch (reportId) {
        case "ventas":
          const rv = await backofficeApi.reportesResumenVentasDetalle(reportRange);
          data = rv?.items || [];
          headers = [
            { label: "Factura", key: "numeroFactura" },
            { label: "Fecha", key: "fecha" },
            { label: "Cajero", key: "cajero" },
            { label: "Método Pago", key: "metodoPago" },
            { label: "Total", key: "total" }
          ];
          break;
        case "productos-top":
          data = await backofficeApi.reportesProductosTop({ ...reportRange, top: range.top || 10 });
          headers = [
            { label: "Producto", key: "nombre" },
            { label: "Cantidad Vendida", key: "cantidad" },
            { label: "Total Ventas", key: "total" }
          ];
          break;
        case "vendedores":
          const rvd = await backofficeApi.reportesVentasPorVendedor(reportRange);
          data = rvd?.items || [];
          headers = [
            { label: "Vendedor", key: "vendedor" },
            { label: "Órdenes", key: "ordenes" },
            { label: "Total Venta", key: "totalVentas" }
          ];
          break;
        case "categorias":
          const rc = await backofficeApi.reportesVentasPorCategoria(reportRange);
          data = rc?.items || [];
          headers = [
            { label: "Categoría", key: "nombreCategoria" },
            { label: "Total Venta", key: "total" }
          ];
          break;
        case "caja":
          const rch = await backofficeApi.cajaHistorial({ page: 1, pageSize: 100 });
          data = rch?.items || [];
          headers = [
            { label: "Fecha Cierre", key: "fechaCierre" },
            { label: "Monto Apertura", key: "montoApertura" },
            { label: "Ventas Efectivo", key: "ventasEfectivo" },
            { label: "Total", key: "totalVentas" }
          ];
          break;
        case "movimientos":
          const rm = await backofficeApi.movimientosProductos(reportRange);
          data = rm?.items || [];
          headers = [
            { label: "Fecha", key: "fecha" },
            { label: "Producto", key: "productoNombre" },
            { label: "Tipo", key: "tipo" },
            { label: "Cantidad", key: "cantidad" },
            { label: "Motivo", key: "observaciones" }
          ];
          break;
        default:
          throw new Error("Reporte no soportado.");
      }

      downloadCSV(data, headers, filename);
      snackbar.success("Reporte exportado con éxito.");
    } catch (e) {
      snackbar.error(e.message || "Error al exportar reporte.");
    } finally {
      setExporting(false);
    }
  };

  const openOrderDetail = async (order) => {
    const sourceId = Number(order?.sourceId);
    if (!Number.isFinite(sourceId)) {
      snackbar.error("ID de orden no válido.");
      return;
    }
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailOrder(null);
    try {
      const origin = String(order?.origen || "").toLowerCase();
      const detail =
        origin === "delivery"
          ? await backofficeApi.getDeliveryPedido(sourceId)
          : await backofficeApi.getPedido(sourceId);
      setDetailOrder(detail || null);
    } catch (e) {
      snackbar.error(e.message || "Error al cargar detalle.");
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    if (activeReport) loadReportData(activeReport);
  }, [activeReport]);

  return {
    activeReport, setActiveReport,
    range, setRange,
    rows, summary, orders,
    loading, exporting, error,
    loadReportData, downloadExcel,
    detailOpen, setDetailOpen,
    detailLoading, detailOrder, openOrderDetail
  };
}
