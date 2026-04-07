/**
 * Utilidades y constantes para el Punto de Venta (POS).
 */

// Identificador virtual para procesos del POS
export const POS_ORDER_VIRTUAL_ID = 999;

/**
 * Catálogo unificado para resolver producto por id (carrito, stock): base + resultados de búsqueda.
 * Las filas de búsqueda sustituyen por id al catálogo base (suelen traer stock más reciente).
 */
export function mergePosProductSources(baseProducts, searchResults) {
  const map = new Map();
  for (const p of baseProducts || []) {
    if (p?.id != null && p.id !== "") map.set(Number(p.id), p);
  }
  const sr = Array.isArray(searchResults) ? searchResults : [];
  for (const p of sr) {
    if (p?.id != null && p.id !== "") map.set(Number(p.id), p);
  }
  return map;
}

/**
 * Calcula el subtotal de una lista de items en el carrito.
 */
export function calculateSubtotal(cart) {
  return cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
}

/** Texto para buscar en cliente (nombre, código de producto, SKU/talla de variantes). */
function posProductSearchHaystack(p) {
  const parts = [p?.nombre, p?.codigo];
  const vars = Array.isArray(p?.variantes) ? p.variantes : [];
  for (const v of vars) {
    const sku = v?.sku ?? v?.Sku;
    const talla = v?.talla ?? v?.Talla;
    if (sku != null && String(sku).trim() !== "") parts.push(String(sku));
    if (talla != null && String(talla).trim() !== "") parts.push(String(talla));
  }
  return parts.filter(Boolean).join(" ").toLowerCase();
}

/**
 * Filtra los productos del catálogo según búsqueda y categoría.
 */
export function filterPosProducts(products, search, selectedCategory) {
  const q = search.trim().toLowerCase();
  return products.filter((p) => {
    const catMatch = !selectedCategory || String(p.categoriaProductoId || "") === String(selectedCategory);
    if (!catMatch) return false;
    if (!q) return true;
    return posProductSearchHaystack(p).includes(q);
  });
}
