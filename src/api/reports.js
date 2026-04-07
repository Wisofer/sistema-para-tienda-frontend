import { api, fetchBlob } from "./client.js";

function downloadBlobAsFile(blob, filename) {
  if (!(blob instanceof Blob)) return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.visibility = "hidden";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const qs = (params) => {
  const s = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v != null && v !== "") s.set(k, String(v));
  });
  const str = s.toString();
  return str ? `?${str}` : "";
};

const report = (path, params) => api.get(`/api/v1/reportes/${path}${qs(params)}`);

const dateSlug = () => new Date().toISOString().slice(0, 10);

export const reportsApi = {
  salesSummary: (params) => report("resumen-ventas", params),
  salesDetail: (params) => report("resumen-ventas/detalle", params),
  /** Detalle de un ticket cobrado: `lineas[]`, subtotales, totales (Admin). */
  ventaTicketDetalle: (ventaId) =>
    api.get(`/api/v1/reportes/ventas/${encodeURIComponent(String(ventaId))}/ticket-detalle`),
  /** Excel: resumen de ventas (`exportar=true`). */
  downloadResumenVentasExcel: async (params) => {
    const q = qs({ ...(params || {}), exportar: true });
    const blob = await fetchBlob(`/api/v1/reportes/resumen-ventas${q}`);
    downloadBlobAsFile(blob, `resumen_ventas_${dateSlug()}.xlsx`);
  },
  /** Excel: lista de tickets (una fila por venta). */
  downloadResumenVentasDetalleExcel: async (params) => {
    const q = qs({ ...(params || {}), exportar: true });
    const blob = await fetchBlob(`/api/v1/reportes/resumen-ventas/detalle${q}`);
    downloadBlobAsFile(blob, `ventas_detalle_${dateSlug()}.xlsx`);
  },
  topProducts: (params) => report("productos-top", params),
  ventasPorCategoria: (params) => report("ventas-por-categoria", params),
  /** Alias usado por backofficeApi (mismo endpoint que ventasPorCategoria). */
  salesByCategory: (params) => report("ventas-por-categoria", params),
  /** Desglose por categoría con lista de productos (retail). */
  ventasPorCategoriaDesglose: (params) => report("ventas-por-categoria/desglose", params),
  /** Excel: dos hojas (resumen categoría + filas planas por producto). */
  downloadVentasPorCategoriaDesgloseExcel: async (params) => {
    const q = qs({ ...(params || {}), exportar: true });
    const blob = await fetchBlob(`/api/v1/reportes/ventas-por-categoria/desglose${q}`);
    downloadBlobAsFile(blob, `ventas_por_categoria_desglose_${dateSlug()}.xlsx`);
  },
  /** Ventas agrupadas por usuario/vendedor (retail). */
  salesBySeller: (params) => report("ventas-por-vendedor", params),
  /** Excel: ventas por vendedor (`exportar=true`). */
  downloadVentasPorVendedorExcel: async (params) => {
    const q = qs({ ...(params || {}), exportar: true });
    const blob = await fetchBlob(`/api/v1/reportes/ventas-por-vendedor${q}`);
    downloadBlobAsFile(blob, `ventas_por_vendedor_${dateSlug()}.xlsx`);
  },
};
