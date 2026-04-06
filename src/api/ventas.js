import { api } from "./client.js";

const base = "/api/v1/ventas";

/**
 * API para el procesamiento de pagos y facturación.
 */
export const ventasApi = {
  /** 
   * Procesa el pago de una orden/ticket.
   * @param {Object} body { ordenId, tipoPago, montoPagado, moneda, observaciones, descuentoMonto, detalles: [...] }
   */
  procesarPago: (body) => api.post(`${base}/procesar-pago`, body),

  /** 
   * Alternativa para gestionar el pago (en caso de que la API lo requiera).
   */
  gestionarPago: (body) => api.post(`${base}/gestionar-pago`, body),
};
