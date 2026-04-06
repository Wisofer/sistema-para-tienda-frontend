import { api } from "./client.js";

const base = "/api/v1/configuraciones";

export const settingsApi = {
  list: () => api.get(base),
  get: (clave) => api.get(`${base}/${clave}`),
  upsert: (clave, valor) => api.put(`${base}/${clave}`, { valor }),
  tipoCambio: () => api.get(`${base}/tipo-cambio`),
  updateTipoCambio: (val) => api.put(`${base}/tipo-cambio`, { tipoCambioDolar: val }),
};
