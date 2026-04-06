import { api } from "./client.js";

const base = "/api/v1/usuarios";

/** El backend espera nombreUsuario (según doc login) o usuario. Mantendremos el mapeo por precaución. */
function toBackendUser(body) {
  if (!body || body instanceof FormData) return body;
  const { usuario, ...rest } = body;
  return usuario !== undefined ? { ...rest, nombreUsuario: usuario } : body;
}

export const usersApi = {
  list: () => api.get(base),
  get: (id) => api.get(`${base}/${id}`),
  create: (body) => api.post(base, toBackendUser(body)),
  update: (id, body) => api.put(`${base}/${id}`, { ...toBackendUser(body), id }),
  delete: (id) => api.delete(`${base}/${id}`),
};
