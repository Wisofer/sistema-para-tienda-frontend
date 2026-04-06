import { api } from "./client.js";

const qs = (params) => {
  const s = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => { if (v != null && v !== "") s.set(k, v); });
  const str = s.toString();
  return str ? `?${str}` : "";
};

export const dashboardApi = {
  resumen: (params) => api.get(`/api/v1/dashboard/resumen${qs(params || {})}`),
};
