/** 
 * Utilidades para el módulo de Inventario.
 * Extraídas de ProductsView.jsx para mejorar la mantenibilidad y reducir duplicación.
 */

/** 
 * Determina si un producto tiene activado el control de stock.
 * @param {Object} p - El objeto producto.
 * @returns {boolean}
 */
export function tieneControlStock(p) {
  return Boolean(p?.controlarStock ?? p?.ControlarStock);
}

/**
 * Añade `categoriaNombre` desde el catálogo cuando el producto no lo trae del API.
 * @param {Array<Object>} products
 * @param {Array<{id: unknown, nombre?: string, Nombre?: string}>} categories
 */
export function enrichProductsWithCategoryNames(products, categories) {
  const list = Array.isArray(products) ? products : [];
  const cats = Array.isArray(categories) ? categories : [];
  return list.map((p) => {
    if (p?.categoriaNombre) return p;
    const cid = p.categoriaProductoId ?? p.CategoriaProductoId ?? p.categoriaId ?? p.CategoriaId;
    const cat = cats.find((c) => String(c.id) === String(cid));
    return {
      ...p,
      categoriaNombre: cat?.nombre || cat?.Nombre || "",
    };
  });
}

/**
 * Categorías derivadas del listado de productos (rol Normal: sin GET /catalogos).
 */
export function buildCategoriesFromProducts(products) {
  const map = new Map();
  for (const p of Array.isArray(products) ? products : []) {
    const id = p.categoriaProductoId ?? p.CategoriaProductoId ?? p.categoriaId ?? p.categoria?.id ?? p.Categoria?.Id;
    const nombre =
      p.categoriaNombre ??
      p.CategoriaNombre ??
      p.categoria?.nombre ??
      p.Categoria?.Nombre;
    if (id == null && (nombre == null || String(nombre).trim() === "")) continue;
    const key = id != null ? String(id) : String(nombre).trim();
    if (map.has(key)) continue;
    map.set(key, {
      id: id ?? key,
      nombre:
        nombre != null && String(nombre).trim() !== ""
          ? String(nombre).trim()
          : "Sin categoría",
    });
  }
  return Array.from(map.values()).sort((a, b) => String(a.nombre).localeCompare(String(b.nombre), "es"));
}

/** 
 * Obtiene el ID numérico del producto desde un objeto de movimiento.
 * Maneja las inconsistencias de nombres en la API (camelCase vs PascalCase).
 * @param {Object} m - El objeto de movimiento.
 * @returns {number|null}
 */
export function movementProductId(m) {
  return m?.productoId ?? m?.ProductoId ?? m?.producto?.id ?? m?.Producto?.Id ?? null;
}

/** 
 * Resuelve la etiqueta (nombre) de un producto dentro de un movimiento.
 * @param {Object} m - El objeto de movimiento.
 * @param {Array} productList - Lista de productos para fallback si la API no devuelve el nombre.
 * @returns {string}
 */
export function movementProductLabel(m, productList) {
  const fromApi =
    m?.productoNombre ??
    m?.ProductoNombre ??
    m?.nombreProducto ??
    m?.NombreProducto ??
    m?.producto?.nombre ??
    m?.Producto?.Nombre;
  
  if (fromApi) return String(fromApi);
  
  const id = movementProductId(m);
  const p = productList?.find((x) => String(x.id) === String(id));
  
  if (p?.nombre) return p.nombre;
  return id != null ? `Producto #${id}` : "—";
}

/**
 * Unifica campos camelCase / PascalCase del API para tablas de movimientos.
 */
export function normalizeMovementRow(m) {
  if (!m || typeof m !== "object") return m;
  const tipoRaw = m.tipo ?? m.Tipo ?? m.tipoMovimiento ?? m.TipoMovimiento ?? "";
  const s = String(tipoRaw).trim().toLowerCase();
  let tipo = "—";
  if (s.includes("entrada")) tipo = "Entrada";
  else if (s.includes("salida")) tipo = "Salida";
  else if (s.includes("ajuste")) tipo = "Ajuste";
  else if (String(tipoRaw).trim()) tipo = String(tipoRaw).trim();
  return {
    ...m,
    tipo,
    cantidad: m.cantidad ?? m.Cantidad ?? 0,
    subtipo: m.subtipo ?? m.Subtipo ?? m.subTipo ?? "",
    observaciones: m.observaciones ?? m.Observaciones ?? "",
    fecha: m.fecha ?? m.Fecha ?? m.fechaCreacion ?? m.FechaCreacion ?? m.createdAt ?? m.CreatedAt,
  };
}

/** Formatea la fecha de un movimiento para la UI (es-NI). */
export function formatMovementDate(m) {
  const raw = m?.fecha ?? m?.Fecha ?? m?.fechaCreacion ?? m?.FechaCreacion ?? m?.createdAt ?? m?.CreatedAt;
  if (raw == null || raw === "") return null;
  
  try {
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return String(raw);
    return d.toLocaleString("es-NI", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return String(raw);
  }
}

/** 
 * Clases de utilidad para estilos consistentes en los modales de inventario.
 */
export const productModalFieldClass =
  "mt-1 w-full min-h-[44px] rounded-lg border border-slate-300 px-3 py-2.5 text-base sm:min-h-0 sm:py-2 sm:text-sm";

/** Mismo aspecto que un `<input disabled>` del modal (código al editar, stock al editar). */
export const productModalInputLockedClass =
  "disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

export const productModalCodigoFieldClass = 
  `${productModalFieldClass} placeholder:text-[10px] placeholder:leading-snug placeholder:text-slate-400 sm:placeholder:text-xs`;

export const productModalTextareaClass =
  "mt-1 w-full min-h-[5.5rem] rounded-lg border border-slate-300 px-3 py-2.5 text-base sm:min-h-0 sm:py-2 sm:text-sm";

/**
 * Convierte un objeto File a una cadena Base64 (DataURL).
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve(null);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Id de categoría para filtro de inventario (string o vacío = todas).
 */
export function normalizeInventoryCategoryFilterId(categoriaId) {
  return categoriaId != null && String(categoriaId).trim() !== "" ? String(categoriaId) : "";
}

/** SessionStorage: al ir de «Categorías» (menú) a Inventario con filtro aplicado. */
export const SESSION_PENDING_INVENTORY_CATEGORY = "st_inv_cat_pending";

/** Lee y borra el filtro pendiente; `null` = no había navegación desde el menú. */
export function consumePendingInventoryCategory() {
  try {
    const raw = sessionStorage.getItem(SESSION_PENDING_INVENTORY_CATEGORY);
    if (raw === null) return null;
    sessionStorage.removeItem(SESSION_PENDING_INVENTORY_CATEGORY);
    return raw;
  } catch {
    return null;
  }
}

export function setPendingInventoryCategory(categoriaId) {
  const id = normalizeInventoryCategoryFilterId(categoriaId);
  try {
    sessionStorage.setItem(SESSION_PENDING_INVENTORY_CATEGORY, id);
  } catch {
    /* */
  }
}

/**
 * Recorre todas las páginas del listado de productos hasta completar ítems o alcanzar `maxPages`.
 * @param {(params: Record<string, unknown>) => Promise<{ items?: unknown[]; totalPages?: number }>} listProductos
 */
export async function fetchAllProductPages(listProductos, baseParams = {}, options = {}) {
  const pageSize = options.pageSize ?? 200;
  const maxPages = options.maxPages ?? 200;
  const all = [];
  let page = 1;
  for (;;) {
    const data = await listProductos({ ...baseParams, page, pageSize });
    const chunk = Array.isArray(data?.items) ? data.items : [];
    all.push(...chunk);
    const tp = Number(data?.totalPages ?? 1) || 1;
    if (chunk.length < pageSize || page >= tp) break;
    page += 1;
    if (page > maxPages) break;
  }
  return all;
}

/** Cuenta productos por `categoriaProductoId` (listado normalizado del API). */
export function aggregateProductCountsByCategoryId(items) {
  const map = {};
  (Array.isArray(items) ? items : []).forEach((p) => {
    const cid = p.categoriaProductoId ?? p.CategoriaProductoId;
    if (cid == null || cid === "") return;
    const k = String(cid);
    map[k] = (map[k] || 0) + 1;
  });
  return map;
}
