import { 
  BarChart3, 
  Boxes, 
  Users, 
  Tags, 
  CircleDollarSign, 
  History 
} from "lucide-react";

/**
 * Catálogo de reportes disponibles en el sistema.
 */
export const reportCards = [
  {
    id: "ventas",
    title: "Reporte de Ventas",
    description: "Ventas por periodo con métricas generales y desglose diario.",
    icon: BarChart3,
    color: "bg-blue-100 text-blue-600",
    button: "Ver reporte",
  },
  {
    id: "productos-top",
    title: "Productos Más Vendidos",
    description: "Top de productos por cantidad vendida y total de ventas.",
    icon: Boxes,
    color: "bg-green-100 text-green-600",
    button: "Ver reporte",
  },
  {
    id: "vendedores",
    title: "Ventas por Vendedor",
    description: "Desempeño de ventas por cada usuario del sistema.",
    icon: Users,
    color: "bg-purple-100 text-purple-600",
    button: "Ver reporte",
  },
  {
    id: "categorias",
    title: "Ventas por Categoría",
    description: "Desglose de ventas agrupadas por categoría de producto.",
    icon: Tags,
    color: "bg-orange-100 text-orange-600",
    button: "Ver reporte",
  },
  {
    id: "caja",
    title: "Cierre de Caja",
    description: "Historial de aperturas y cierres de caja con arqueo.",
    icon: CircleDollarSign,
    color: "bg-amber-100 text-amber-600",
    button: "Ver reporte",
  },
  {
    id: "movimientos",
    title: "Movimientos de Inventario",
    description: "Registro de entradas, salidas y ajustes de stock de productos.",
    icon: History,
    color: "bg-red-100 text-red-600",
    button: "Ver reporte",
  },
];

/** 
 * Resuelve el nombre de una categoría para mostrar en los reportes.
 * Maneja las distintas formas en las que la API puede devolver el nombre.
 */
export function categoriaReporteNombre(row, index) {
  const r = row || {};
  return (
    r.nombreCategoria ??
    r.NombreCategoria ??
    r.categoriaNombre ??
    r.CategoriaNombre ??
    r.categoria ??
    r.nombre ??
    r.label ??
    (r.categoriaId != null || r.CategoriaProductoId != null
      ? `Categoría #${r.categoriaId ?? r.CategoriaProductoId}`
      : null) ??
    `Categoría ${index + 1}`
  );
}

/**
 * Monto del reporte “ventas por categoría” según nombres habituales en API (.NET / front).
 */
export function reporteCategoriaMonto(row) {
  const r = row || {};
  const raw =
    r.total ??
    r.Total ??
    r.venta ??
    r.Venta ??
    r.totalNeto ??
    r.TotalNeto ??
    r.totalVentas ??
    r.TotalVentas ??
    r.montoTotal ??
    r.MontoTotal ??
    r.monto ??
    r.Monto ??
    r.importe ??
    r.Importe ??
    0;
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Normaliza la respuesta de GET /reportes/ventas/{id}/ticket-detalle para el modal de detalle.
 */
export function normalizeReporteTicketDetalle(raw) {
  const d =
    raw && typeof raw === "object"
      ? raw.data ?? raw.Data ?? raw
      : null;
  if (!d || typeof d !== "object") {
    return {
      kind: "ticket",
      numero: "-",
      fecha: "",
      estado: "",
      items: [],
      total: 0,
      subtotalLineas: 0,
      totalCobrado: 0,
      cantidadLineas: 0,
      cantidadUnidades: 0,
    };
  }
  const lineas = d.lineas ?? d.Lineas ?? [];
  const ventaIdRaw = d.ventaId ?? d.VentaId ?? d.id ?? d.Id ?? null;
  const ventaIdNum = ventaIdRaw != null && ventaIdRaw !== "" ? Number(ventaIdRaw) : null;

  /** Alineado con ticket-detalle: productoNombre (oficial), nombreProducto (serialización C# antigua), codigoProducto como respaldo. */
  function pickLineaProductoEtiqueta(l) {
    const name =
      l.productoNombre ??
      l.ProductoNombre ??
      l.nombreProducto ??
      l.NombreProducto ??
      l.nombre ??
      l.Nombre ??
      l.producto ??
      l.Producto ??
      "";
    const code = l.codigoProducto ?? l.CodigoProducto ?? "";
    const n = String(name).trim();
    if (n) return n;
    const c = String(code).trim();
    if (c) return c;
    return "-";
  }

  const items = Array.isArray(lineas)
    ? lineas.map((l, i) => {
        const cant = Number(l.cantidad ?? l.Cantidad ?? 0);
        const pu = Number(l.precioUnitario ?? l.PrecioUnitario ?? l.precio ?? l.Precio ?? 0);
        const sub = Number(
          l.subtotal ??
            l.Subtotal ??
            l.subtotalLinea ??
            l.totalLinea ??
            l.TotalLinea ??
            (Number.isFinite(cant) && Number.isFinite(pu) ? cant * pu : 0)
        );
        const detalleIdRaw = l.detalleId ?? l.DetalleId ?? l.id ?? l.Id;
        const detalleIdNum =
          detalleIdRaw != null && detalleIdRaw !== "" ? Number(detalleIdRaw) : null;
        const anulado = Boolean(l.anulado ?? l.Anulado ?? false);
        return {
          id: detalleIdRaw ?? l.productoId ?? l.ProductoId ?? i,
          detalleId: Number.isFinite(detalleIdNum) && detalleIdNum > 0 ? detalleIdNum : null,
          anulado,
          servicio: null,
          producto: pickLineaProductoEtiqueta(l),
          cantidad: cant,
          precioUnitario: pu,
          monto: sub,
          variante: l.talla ?? l.Talla ?? l.variante ?? l.Variante ?? l.varianteDescripcion ?? "",
        };
      })
    : [];

  const subtotalLineas = Number(d.subtotalLineas ?? d.SubtotalLineas ?? 0);
  const totalCobrado = Number(d.totalCobrado ?? d.TotalCobrado ?? d.total ?? d.Total ?? 0);

  return {
    kind: "ticket",
    ventaId: Number.isFinite(ventaIdNum) && ventaIdNum > 0 ? ventaIdNum : null,
    numero:
      d.numeroTicket ?? d.NumeroTicket ?? d.numero ?? d.Numero ?? d.ticket ?? d.Ticket ?? "-",
    fecha: d.fecha ?? d.Fecha ?? "",
    estado: d.estado ?? d.Estado ?? "",
    clienteNombre:
      d.cliente ?? d.Cliente ?? d.clienteNombre ?? d.ClienteNombre ?? "",
    subtotalLineas,
    totalCobrado,
    cantidadLineas: Number(d.cantidadLineas ?? d.CantidadLineas ?? items.length),
    cantidadUnidades: Number(
      d.cantidadUnidades ??
        d.CantidadUnidades ??
        items.reduce((s, it) => s + Number(it.cantidad || 0), 0)
    ),
    items,
    total: totalCobrado || subtotalLineas,
  };
}
