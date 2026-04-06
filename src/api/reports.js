import { api } from "./client.js";

const qs = (params) => {
  const s = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => { if (v != null && v !== "") s.set(k, v); });
  const str = s.toString();
  return str ? `?${str}` : "";
};

const report = (path, params) => api.get(`/api/v1/reportes/${path}${qs(params)}`);

export const reportsApi = {
  salesSummary: (params) => report("resumen-ventas", params),
  salesDetail: (params) => report("resumen-ventas/detalle", params),
  topProducts: (params) => report("productos-top", params),
  ventasPorCategoria: (params) => report("ventas-por-categoria", params),
};
