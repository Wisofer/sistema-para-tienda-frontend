/**
 * Catálogo POS con opciones (productos activos + categorías).
 * @param {object} api — típicamente `backofficeApi`
 * @param {number} pageSize — ej. `PAGINATION.POS_PRODUCTOS`
 */
export async function fetchPosProductosYCategorias(api, pageSize) {
  const [productsData, categoriesData] = await Promise.all([
    api.listProductos({
      page: 1,
      pageSize,
      activos: true,
      incluirOpciones: true,
      incluirVariantes: true,
    }),
    api.catalogoCategoriasProducto(),
  ]);
  const products = Array.isArray(productsData?.items) ? productsData.items : [];
  const categories = Array.isArray(categoriesData) ? categoriesData : categoriesData?.items || [];
  return { products, categories };
}

/**
 * Búsqueda de productos para el POS (mismos flags que el catálogo inicial).
 * El listado inicial solo trae la primera página; sin esto, buscar por código/nombre
 * solo filtra entre esos ~N productos y puede no encontrar nada.
 */
export async function fetchPosProductosBusqueda(api, pageSize, { search, categoriaId, signal } = {}) {
  const q = String(search ?? "").trim();
  if (!q) return [];
  const fetchOpts = signal ? { signal } : {};
  const data = await api.listProductos(
    {
      page: 1,
      pageSize,
      search: q,
      activos: true,
      incluirOpciones: true,
      incluirVariantes: true,
      ...(categoriaId != null && String(categoriaId).trim() !== ""
        ? { categoriaId: String(categoriaId) }
        : {}),
    },
    fetchOpts
  );
  return Array.isArray(data?.items) ? data.items : [];
}
