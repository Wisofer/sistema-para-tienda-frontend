import { mapVariantesFromBackend } from "../../../api/products.js";

/**
 * Variantes de producto (tallas / SKU) en el POS — envío de `productoVarianteId` al backend.
 */

/** Lista normalizada desde el producto del catálogo (mismo criterio que `fromBackendProduct`). */
export function normalizeProductoVariantes(product) {
  return mapVariantesFromBackend(product?.variantes ?? product?.Variantes);
}

/**
 * Más de una variante: el usuario debe elegir en el POS (modal).
 * Una sola variante: el backend acepta solo productoId; el front puede enviar igual el id explícito.
 */
export function productoRequiereModalVariante(product) {
  return normalizeProductoVariantes(product).length > 1;
}

/**
 * Etiqueta compacta para la línea del carrito: quita segmentos «N/A» y colores residuales en strings viejos.
 */
export function compactVarianteEtiquetaCarrito(opcionesResumen, talla) {
  let s = String(opcionesResumen ?? "").trim();
  if (!s && talla) s = String(talla).trim();
  if (!s) return "";
  const parts = s
    .split(" · ")
    .map((p) => p.trim())
    .filter((p) => p && p.toUpperCase() !== "N/A");
  return parts.join(" · ");
}

/** Texto corto para POS: solo talla (sin color). Si talla es vacía o «N/A», se usa SKU o id. */
export function labelVarianteResumen(variante) {
  if (!variante) return "";
  const talla = String(variante.talla ?? "").trim();
  if (talla && talla.toUpperCase() !== "N/A") return talla;
  if (variante.sku) return String(variante.sku);
  return `Variante #${variante.id}`;
}
