import { api } from "./client.js";

const base = "/api/v1/usuarios";

function qs(params) {
  const s = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v != null && v !== "") s.set(k, String(v));
  });
  const str = s.toString();
  return str ? `?${str}` : "";
}

/** El backend espera nombreUsuario (según doc login) o usuario. Mantendremos el mapeo por precaución. */
function toBackendUser(body) {
  if (!body || body instanceof FormData) return body;
  const { usuario, ...rest } = body;
  return usuario !== undefined ? { ...rest, nombreUsuario: usuario } : body;
}

export const usersApi = {
  list: (params) => api.get(`${base}${qs(params || {})}`),
  get: (id) => api.get(`${base}/${id}`),
  create: (body) => api.post(base, toBackendUser(body)),
  update: (id, body) => api.put(`${base}/${id}`, { ...toBackendUser(body), id }),
  delete: (id) => api.delete(`${base}/${id}`),
};
