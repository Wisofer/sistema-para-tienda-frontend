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
 * Stock disponible para reglas del POS (alineado con la tarjeta: una variante → su stock; sin variantes → `product.stock`).
 * Si hay varias tallas y no se pasa `varianteId`, devuelve `null` (hay que elegir en el modal).
 */
export function getPosStockDisponible(product, varianteId) {
  if (!product) return null;
  const vars = normalizeProductoVariantes(product);
  const vid =
    varianteId != null && Number.isFinite(Number(varianteId)) && Number(varianteId) > 0
      ? Number(varianteId)
      : null;
  if (vid != null) {
    const v = vars.find((x) => x.id === vid);
    if (v) return Number(v.stock ?? 0);
  }
  if (vars.length === 1) {
    return Number(vars[0].stock ?? 0);
  }
  if (vars.length === 0) {
    return Number(product.stock ?? 0);
  }
  return null;
}

/**
 * Suma cantidades en carrito del mismo “bucket” de inventario: mismo producto y misma variante (si aplica).
 * `excludeLineId`: línea a ignorar (p. ej. la que se está editando).
 */
export function cartQtyForProductBucket(prev, excludeLineId, item) {
  const pid = Number(item?.id);
  if (!Number.isFinite(pid)) return 0;
  const targetVid = item?.varianteId != null && Number(item.varianteId) > 0 ? Number(item.varianteId) : null;
  const list = Array.isArray(prev) ? prev : [];
  return list.reduce((s, x) => {
    if (excludeLineId != null && x.lineId === excludeLineId) return s;
    if (Number(x.id) !== pid) return s;
    const lineVid = x.varianteId != null && Number(x.varianteId) > 0 ? Number(x.varianteId) : null;
    if (targetVid != null || lineVid != null) {
      if (targetVid !== lineVid) return s;
    }
    return s + Math.max(1, Math.floor(Number(x.qty) || 1));
  }, 0);
}

/** Tarjeta del catálogo: bloquear clic si controla stock y no queda unidad (una sola variante o sin variantes). */
export function isProductBlockedByStockForPos(product) {
  if (!product?.controlarStock) return false;
  const s = getPosStockDisponible(product, null);
  if (s === null) return false;
  return s <= 0;
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
