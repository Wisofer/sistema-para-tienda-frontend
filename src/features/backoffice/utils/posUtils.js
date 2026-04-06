/**
 * Utilidades y constantes para el Punto de Venta (POS).
 */

// Identificador virtual para procesos del POS
export const POS_ORDER_VIRTUAL_ID = 999;

/**
 * Calcula el subtotal de una lista de items en el carrito.
 */
export function calculateSubtotal(cart) {
  return cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
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
    return `${p.nombre || ""} ${p.codigo || ""}`.toLowerCase().includes(q);
  });
}
