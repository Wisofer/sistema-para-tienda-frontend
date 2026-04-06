import { api } from "./client.js";

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
  cierrePreview: () => api.get(`${base}/cierre/preview`),
  cierre: (body) => api.post(`${base}/cierre`, body),
  historial: (params) => api.get(`${base}/historial${qs(params)}`),
};
