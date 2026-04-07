import { buildCategoriesFromProducts } from "./inventoryUtils.js";

/**
 * Catálogo POS con opciones (productos activos + categorías).
 * Si GET /catalogos/categorias-producto no está permitido (403), las categorías se derivan de los productos.
 * @param {object} api — típicamente `backofficeApi`
 * @param {number} pageSize — ej. `PAGINATION.POS_PRODUCTOS`
 */
export async function fetchPosProductosYCategorias(api, pageSize) {
  const productsData = await api.listProductos({
    page: 1,
    pageSize,
    activos: true,
    incluirOpciones: true,
    incluirVariantes: true,
  });
  const products = Array.isArray(productsData?.items) ? productsData.items : [];
  let categories = [];
  try {
    const categoriesData = await api.catalogoCategoriasProducto();
    categories = Array.isArray(categoriesData) ? categoriesData : categoriesData?.items || [];
  } catch {
    categories = buildCategoriesFromProducts(products);
  }
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
