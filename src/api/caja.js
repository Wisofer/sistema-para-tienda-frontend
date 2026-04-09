import { api, fetchExportBlob } from "./client.js";
import { downloadBlobAsFile } from "./downloadUtils.js";

const base = "/api/v1/caja";

function qs(params) {
  const s = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => { if (v != null && v !== "") s.set(k, v); });
  const str = s.toString();
  return str ? `?${str}` : "";
}

export const cajaApi = {
  estado: () => api.get(`${base}/estado`),
  apertura: (montoInicial) => api.post(`${base}/apertura`, { montoInicial }),
  cierrePreview: (params) => api.get(`${base}/cierre/preview${qs(params || {})}`),
  cierre: (body) => api.post(`${base}/cierre`, body),
  historial: (params) => api.get(`${base}/historial${qs(params)}`),
  /** Detalle de un cierre por id (mismo payload que el backend expone en cierres/{id}). */
  detalle: (id) => api.get(`${base}/cierres/${id}`),
  /** Excel de historial de cierres; filtros opcionales desde/hasta (fecha de cierre). */
  exportarHistorialExcel: async (params) => {
    const q = qs(params || {});
    const blob = await fetchExportBlob(`${base}/historial/exportar${q}`);
    downloadBlobAsFile(blob, `historial_cierres_caja_${new Date().toISOString().slice(0, 10)}.xlsx`);
  },
};
