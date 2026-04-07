import { api, fetchExportBlob } from "./client.js";
import { downloadBlobAsFile } from "./downloadUtils.js";

const qs = (params) => {
  const s = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v != null && v !== "") s.set(k, String(v));
  });
  const str = s.toString();
  return str ? `?${str}` : "";
};

const dateSlug = () => new Date().toISOString().slice(0, 10);

function withExportQuery(params) {
  return qs({ ...(params || {}), exportar: true });
}

async function downloadReportExcel(pathSegment, params, filenameBase) {
  const blob = await fetchExportBlob(`/api/v1/reportes/${pathSegment}${withExportQuery(params)}`);
  downloadBlobAsFile(blob, `${filenameBase}_${dateSlug()}.xlsx`);
}

const report = (path, params) => api.get(`/api/v1/reportes/${path}${qs(params)}`);

export const reportsApi = {
  salesSummary: (params) => report("resumen-ventas", params),
  salesDetail: (params) => report("resumen-ventas/detalle", params),
  /** Detalle de un ticket cobrado: `lineas[]`, subtotales, totales (Admin). */
  ventaTicketDetalle: (ventaId) =>
    api.get(`/api/v1/reportes/ventas/${encodeURIComponent(String(ventaId))}/ticket-detalle`),
  /** Excel: resumen de ventas (`exportar=true`). */
  downloadResumenVentasExcel: (params) => downloadReportExcel("resumen-ventas", params, "resumen_ventas"),
  /**
   * Excel: misma hoja que el detalle de tickets (una fila por venta, respeta filtroVentas).
   * Debe usar `resumen-ventas?exportar=true`: `/detalle` solo devuelve JSON y no exporta.
   */
  downloadResumenVentasDetalleExcel: (params) =>
    downloadReportExcel("resumen-ventas", params, "ventas_detalle"),
  topProducts: (params) => report("productos-top", params),
  /** Excel: top productos (`exportar=true`). */
  downloadProductosTopExcel: (params) => downloadReportExcel("productos-top", params, "top_productos"),
  ventasPorCategoria: (params) => report("ventas-por-categoria", params),
  /** Alias usado por backofficeApi (mismo endpoint que ventasPorCategoria). */
  salesByCategory: (params) => report("ventas-por-categoria", params),
  /** Desglose por categoría con lista de productos (retail). */
  ventasPorCategoriaDesglose: (params) => report("ventas-por-categoria/desglose", params),
  /** Excel: dos hojas (resumen categoría + filas planas por producto). */
  downloadVentasPorCategoriaDesgloseExcel: (params) =>
    downloadReportExcel("ventas-por-categoria/desglose", params, "ventas_por_categoria_desglose"),
  /** Ventas agrupadas por usuario/vendedor (retail). */
  salesBySeller: (params) => report("ventas-por-vendedor", params),
  /** Excel: ventas por vendedor (`exportar=true`). */
  downloadVentasPorVendedorExcel: (params) =>
    downloadReportExcel("ventas-por-vendedor", params, "ventas_por_vendedor"),
};
