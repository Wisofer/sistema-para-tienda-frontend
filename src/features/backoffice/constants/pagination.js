/**
 * Tamaños de página usados en llamadas a la API (un solo lugar para el front).
 * El servidor sigue siendo la fuente de verdad para totales y validación.
 */
export const PAGINATION = {
  LIST_DEFAULT: 20,
  LIST_LARGE: 100,
  POS_PRODUCTOS: 200,
  /** Catálogo para modales / lookups; no superar el máximo del API (p. ej. 200). */
  CATALOG_ALERTS: 200,
  /** Listado paginado en administración de productos (máx. típico API: 200). */
  PRODUCTOS_ADMIN: 200,
  MOVIMIENTOS: 200,
};
