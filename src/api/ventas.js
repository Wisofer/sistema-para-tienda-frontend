import { api, fetchBlob } from "./client.js";

const base = "/api/v1/ventas";

function qs(params) {
  const s = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v != null && v !== "") s.set(k, String(v));
  });
  const str = s.toString();
  return str ? `?${str}` : "";
}

/**
 * API para ventas, cobro y ticket PDF (retail POS).
 */
export const ventasApi = {
  list: (params) => api.get(`${base}${qs(params || {})}`),
  get: (id) => api.get(`${base}/${id}`),

  /**
   * Procesa el pago de una venta pendiente (POS).
   * @param {Object} body { VentaId, TipoPago, MontoPagado, Moneda: Cordobas|Dolares, DescuentoPorcentaje?, DescuentoMonto?, ... }
   */
  procesarPago: (body) => api.post(`${base}/procesar-pago`, body),

  /** Alias del mismo flujo de cobro (backend). */
  gestionarPago: (body) => api.post(`${base}/gestionar-pago`, body),

  /** PDF del ticket (GET autenticado). */
  ticketPdf: (id) => fetchBlob(`${base}/${encodeURIComponent(String(id))}/ticket`),

  /**
   * Anula una venta cobrada (Admin + código `CodigoCancelacionVenta`).
   * @param {string|number} id
   * @param {{ codigo: string, motivo?: string }} body
   */
  cancelar: (id, body) => api.post(`${base}/${encodeURIComponent(String(id))}/cancelar`, body),

  /**
   * Devolución parcial por líneas de detalle.
   * @param {string|number} id
   * @param {{ codigo: string, detalleIds: number[], motivo?: string }} body
   */
  cancelarParcial: (id, body) => api.post(`${base}/${encodeURIComponent(String(id))}/cancelar-parcial`, body),
};
