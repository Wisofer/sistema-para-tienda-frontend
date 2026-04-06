import { api } from "./client.js";

const base = "/api/v1/pos";

/**
 * API para operaciones específicas del Punto de Venta (POS).
 */
export const posApi = {
  /**
   * Registra una venta o ticket en el POS (Retail)
   * @param {Object} body { Items: [{ ProductoId, Cantidad, ProductoVarianteId }] }
   */
  ventas: (body) => api.post(`${base}/ventas`, body),
};
