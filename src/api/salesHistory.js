import { api, fetchBlob } from "./client.js";

const base = "/api/v1/ventas";

/** Backend espera id numérico en la URL (ej. 36); la respuesta puede traer id "V36". */
function toNumericId(id) {
  if (id == null) return id;
  const s = String(id);
  const m = s.match(/^V(\d+)$/i);
  return m ? m[1] : s;
}

function qs(params) {
  const s = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v != null && v !== "") s.set(k, String(v));
  });
  const str = s.toString();
  return str ? `?${str}` : "";
}

/**
 * Historial de ventas alineado con el backend retail (`/api/v1/ventas`).
 * Operaciones no expuestas en la API devuelven error explícito.
 */
export const salesHistoryApi = {
  list: (params) => api.get(`${base}${qs(params || {})}`),
  get: (id) => api.get(`${base}/${toNumericId(id)}`),
  /** PDF del ticket (misma ruta que documentación técnica). */
  downloadTicketPdf: (id) => fetchBlob(`${base}/${toNumericId(id)}/ticket`),

  /** @deprecated Usar `downloadTicketPdf`. */
  ticketPdfUrl: (id) => api.get(`${base}/${toNumericId(id)}/ticket-pdf-url`),

  cancel: async () => {
    throw new Error("Anular venta no está expuesto en la API actual.");
  },
  addPayment: async () => {
    throw new Error("Agregar pago a venta existente no está expuesto en la API actual.");
  },
  createOrReuseInvoice: async () => {
    throw new Error("Facturación aparte no está expuesta en la API actual.");
  },
};
