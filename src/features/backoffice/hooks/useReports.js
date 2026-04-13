import { useState, useCallback, useEffect } from "react";
import { backofficeApi } from "../services/backofficeApi.js";
import { normalizeMovementRow } from "../utils/inventoryUtils.js";
import { normalizeReporteTicketDetalle } from "../utils/reportUtils.js";
import { useSnackbar } from "../../../contexts/SnackbarContext.jsx";

/**
 * Hook personalizado para manejar la lógica de los reportes administrativos.
 * Exportación Excel: el servidor genera el `.xlsx`; aquí solo se invoca `backofficeApi.*` (ver `docs/REPORTES_BACKEND.md`).
 *
 * @param {string} currencySymbol - Símbolo de moneda.
 */
export function useReports(currencySymbol = "C$") {
  const snackbar = useSnackbar();
  const [activeReport, setActiveReport] = useState(null);
  const [range, setRange] = useState({
    desde: "",
    hasta: "",
    top: 10,
    /** @type {'activas'|'anuladas'|'todas'} */
    filtroVentas: "activas",
  });
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

  // Detalle productos por categoría (reporte categorías)
  const [categoriaDetailOpen, setCategoriaDetailOpen] = useState(false);
  const [categoriaDetailRow, setCategoriaDetailRow] = useState(null);

  const reportRange = {
    desde: range?.desde?.trim() || undefined,
    hasta: range?.hasta?.trim() || undefined,
    filtroVentas: range?.filtroVentas || "activas",
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
            key: `${o.origen || o.origenPedido || "order"}-${o.id ?? o.Id ?? i}-${i}`,
            sourceId: o.id ?? o.Id ?? o.ventaId ?? o.VentaId ?? null,
            numero: o.numero ?? o.numeroTicket ?? o.NumeroTicket ?? o.codigo ?? o.ticket ?? `#${i + 1}`,
            fecha: o.fecha ?? o.fechaVenta ?? o.fechaCreacion ?? o.createdAt ?? "",
            origen: o.origen ?? o.origenPedido ?? "POS",
            referencia:
              o.clienteNombre ??
              o.ClienteNombre ??
              o.cliente ??
              o.mesa ??
              o.mesaNumero ??
              (String(o.origen || o.origenPedido || "").toLowerCase() === "delivery" ? "Delivery" : "-"),
            vendedor: o.cajero ?? o.Cajero ?? o.mesero ?? o.usuario ?? "-",
            monto: Number(o.totalCobrado ?? o.TotalCobrado ?? o.monto ?? o.total ?? 0),
            cantidadLineas: o.cantidadLineas ?? o.CantidadLineas,
            subtotalLineas: o.subtotalLineas ?? o.SubtotalLineas,
            estado: String(o.estado ?? o.Estado ?? "").trim() || "—",
            metodoPago: o.metodoPago ?? o.MetodoPago ?? "",
            moneda: o.moneda ?? o.Moneda ?? null,
            fechaUltimaActualizacion:
              o.fechaUltimaActualizacion ?? o.FechaUltimaActualizacion ?? null,
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
        const result = items.map((r) => {
          const totalNeto = Number(r.totalNeto ?? r.TotalNeto ?? r.totalVentas ?? r.total ?? 0);
          const cantidadTickets = Number(r.cantidadTickets ?? r.CantidadTickets ?? r.ordenes ?? r.Ordenes ?? 0);
          return {
            usuarioId: r.usuarioId ?? r.UsuarioId ?? null,
            vendedor:
              String(r.nombreCompleto ?? r.NombreCompleto ?? "").trim() ||
              String(r.nombreUsuario ?? r.NombreUsuario ?? "").trim() ||
              "Sin vendedor",
            nombreUsuario: String(r.nombreUsuario ?? r.NombreUsuario ?? "").trim(),
            rol: String(r.rol ?? r.Rol ?? "—").trim() || "—",
            cantidadTickets,
            totalNeto,
            promedioTicket: Number(r.promedioTicket ?? r.PromedioTicket ?? 0),
          };
        });
        /** El backend ordena por totalNeto descendente; mantenemos orden por si el mock no lo hace. */
        result.sort((a, b) => b.totalNeto - a.totalNeto);

        setRows(result);
        const tv = result.reduce((s, r) => s + r.totalNeto, 0);
        const to = result.reduce((s, r) => s + r.cantidadTickets, 0);
        setSummary({
          totalVentas: tv,
          totalOrdenes: to,
          promedioTicket: to > 0 ? tv / to : 0,
        });
      } else if (reportId === "categorias") {
        const data = await backofficeApi.reportesVentasPorCategoriaDesglose(reportRange);
        const raw = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
        const cats = raw.map((r) => ({
          categoria: String(r.categoria ?? r.Categoria ?? "").trim() || "—",
          monto: Number(r.monto ?? r.Monto ?? 0),
          cantidad: Number(r.cantidad ?? r.Cantidad ?? 0),
          productos: Array.isArray(r.productos ?? r.Productos)
            ? (r.productos ?? r.Productos).map((p) => ({
                productoId: p.productoId ?? p.ProductoId ?? null,
                codigoProducto: String(p.codigoProducto ?? p.CodigoProducto ?? "").trim(),
                productoNombre: String(p.productoNombre ?? p.ProductoNombre ?? "").trim() || "—",
                cantidad: Number(p.cantidad ?? p.Cantidad ?? 0),
                monto: Number(p.monto ?? p.Monto ?? 0),
              }))
            : [],
        }));
        const totalVentas = cats.reduce((s, r) => s + r.monto, 0);
        const totalUnidades = cats.reduce((s, r) => s + r.cantidad, 0);
        setRows(cats);
        setSummary({
          totalVentas,
          totalOrdenes: 0,
          totalCategorias: Number(data?.totalCategorias ?? data?.TotalCategorias ?? cats.length),
          totalUnidades,
          promedioTicket: 0,
        });
      } else if (reportId === "caja") {
        const data = await backofficeApi.cajaHistorial({
          page: 1,
          pageSize: 100,
          desde: reportRange.desde,
          hasta: reportRange.hasta,
        });
        const items = Array.isArray(data?.items) ? data.items : [];
        setRows(items);
        setSummary({
          totalVentas: items.reduce(
            (s, r) =>
              s +
              Number(
                r.totalVentas ?? r.TotalGeneral ?? r.total ?? r.Total ?? 0
              ),
            0
          ),
          totalOrdenes: items.length,
          promedioTicket: 0,
        });
      } else if (reportId === "movimientos") {
        const data = await backofficeApi.movimientosProductos(reportRange);
        const raw =
          data?.items ??
          data?.Items ??
          data?.movimientos ??
          (Array.isArray(data) ? data : []);
        setRows(Array.isArray(raw) ? raw.map(normalizeMovementRow) : []);
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
      switch (reportId) {
        case "ventas":
          await backofficeApi.reportesExportarVentasDetalleExcel(reportRange);
          snackbar.success("Reporte exportado con éxito.");
          return;
        case "productos-top":
          await backofficeApi.reportesExportarProductosTopExcel({
            ...reportRange,
            top: range.top || 10,
          });
          snackbar.success("Reporte exportado con éxito.");
          return;
        case "vendedores":
          await backofficeApi.reportesExportarVentasPorVendedorExcel(reportRange);
          snackbar.success("Reporte exportado con éxito.");
          return;
        case "categorias":
          await backofficeApi.reportesExportarVentasPorCategoriaDesgloseExcel(reportRange);
          snackbar.success("Reporte exportado con éxito.");
          return;
        case "caja":
          await backofficeApi.exportarCajaHistorialExcel(reportRange);
          snackbar.success("Reporte exportado con éxito.");
          return;
        case "movimientos":
          await backofficeApi.exportarMovimientosInventarioExcel(reportRange);
          snackbar.success("Reporte exportado con éxito.");
          return;
        default:
          throw new Error("Reporte no soportado.");
      }
    } catch (e) {
      snackbar.error(e.message || "Error al exportar reporte.");
    } finally {
      setExporting(false);
    }
  };

  const openOrderDetail = async (order) => {
    const sourceId = Number(order?.sourceId);
    if (!Number.isFinite(sourceId) || sourceId <= 0) {
      snackbar.error("ID de orden no válido.");
      return;
    }
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailOrder(null);
    try {
      try {
        const raw = await backofficeApi.reportesVentaTicketDetalle(sourceId);
        const ticket = normalizeReporteTicketDetalle(raw);
        ticket.ventaId = ticket.ventaId ?? sourceId;
        if (ticket.items.length > 0 || ticket.totalCobrado > 0 || ticket.subtotalLineas > 0) {
          setDetailOrder(ticket);
          return;
        }
      } catch {
        /* fallback: pedido legacy / otra API */
      }
      const origin = String(order?.origen || "").toLowerCase();
      const legacy =
        origin === "delivery"
          ? await backofficeApi.getDeliveryPedido(sourceId)
          : await backofficeApi.getPedido(sourceId);
      setDetailOrder(legacy || null);
    } catch (e) {
      snackbar.error(e.message || "Error al cargar detalle.");
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const openCategoriaDetail = useCallback((row) => {
    if (!row) return;
    setCategoriaDetailRow(row);
    setCategoriaDetailOpen(true);
  }, []);

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
    detailLoading, detailOrder, openOrderDetail,
    categoriaDetailOpen, setCategoriaDetailOpen,
    categoriaDetailRow, setCategoriaDetailRow,
    openCategoriaDetail,
  };
}
