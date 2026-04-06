import { api } from "./client.js";

const base = "/api/v1/productos";

function qs(params) {
  const s = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v != null && v !== "") s.set(k, String(v));
  });
  const str = s.toString();
  return str ? `?${str}` : "";
}

function base64ToBlob(base64) {
  if (!base64 || !base64.includes("base64,")) return null;
  const arr = base64.split(",");
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

/** 
 * MAPEO: Frontend (camelCase) -> Backend (FormData PascalCase según documentación)
 */
function toBackendProduct(body) {
  if (!body) return body;
  if (body instanceof FormData) return body;

  const fd = new FormData();
  fd.append("Codigo", body.codigo || body.sku || "");
  fd.append("Nombre", body.nombre || "");
  fd.append("Precio", Number(body.precioVenta || body.precio || 0));
  fd.append("PrecioCompra", Number(body.precioCompra || 0));
  fd.append("Talla", body.talla || "N/A");
  fd.append("StockActual", Number(body.stock || 0));
  fd.append("StockMinimo", Number(body.stockMinimo || 0));
  fd.append("CategoriaProductoId", Number(body.categoriaProductoId || 0));
  fd.append("ControlarStock", Boolean(body.controlarStock));
  fd.append("Activo", Boolean(body.activo !== false)); // Default to true
  
  if (body.proveedorId) {
    fd.append("ProveedorId", Number(body.proveedorId));
  }

  // Convertir base64 a archivo binario si existe
  if (body.imagen) {
    const blob = base64ToBlob(body.imagen);
    if (blob) {
      fd.append("Imagen", blob, "producto.jpg");
    }
  }

  return fd;
}

/**
 * MAPEO: Backend (PascalCase) -> Frontend (camelCase para UI)
 */
export function fromBackendProduct(p) {
  if (!p) return p;
  return {
    id: p.id || p.Id,
    codigo: p.codigo || p.Codigo,
    nombre: p.nombre || p.Nombre,
    precioVenta: p.precio || p.Precio || 0,
    precioCompra: p.precioCompra || p.PrecioCompra || 0,
    stock: p.stockTotal ?? p.StockTotal ?? p.stockActual ?? p.StockActual ?? p.stock ?? 0,
    stockMinimo: p.stockMinimo || p.StockMinimo || 0,
    talla: p.talla || p.Talla,
    imagen: p.imagen || p.Imagen,
    categoriaProductoId: p.categoriaProductoId || p.CategoriaProductoId,
    controlarStock: p.controlarStock ?? p.ControlarStock ?? false,
    activo: p.activo ?? p.Activo ?? true
  };
}

export const productsApi = {
  list: async (params) => {
    const raw = await api.get(`${base}${qs(params || {})}`);
    if (Array.isArray(raw)) return raw.map(fromBackendProduct);
    if (raw?.items) return { ...raw, items: raw.items.map(fromBackendProduct) };
    if (raw?.Items) return { ...raw, items: raw.Items.map(fromBackendProduct) };
    return raw;
  },
  get: async (id) => fromBackendProduct(await api.get(`${base}/${id}`)),
  create: (body) => api.post(base, toBackendProduct(body)),
  update: (id, body) => api.put(`${base}/${id}`, { ...toBackendProduct(body), id }),
  delete: (id) => api.delete(`${base}/${id}`),
};
