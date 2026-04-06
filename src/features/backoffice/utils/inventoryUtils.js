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
 * Formatea la fecha de un movimiento para su visualización.
 * @param {Object} m - El objeto de movimiento.
 * @returns {string|null}
 */
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
