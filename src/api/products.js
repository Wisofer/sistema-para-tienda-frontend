import { api, fetchBlob } from "./client.js";
import { getApiUrl } from "./config.js";

const base = "/api/v1/productos";
const inventarioBase = "/api/v1/inventario";

/** URL absoluta para imágenes guardadas como ruta relativa en el servidor. */
function resolveImagenUrl(val) {
  if (val == null || typeof val !== "string") return val;
  const v = val.trim();
  if (!v) return v;
  if (v.startsWith("http://") || v.startsWith("https://") || v.startsWith("data:")) return v;
  if (v.startsWith("/")) return `${getApiUrl()}${v}`;
  return v;
}

/** El API documenta pageSize máx. 200; valores mayores devuelven 400. */
const MAX_PAGE_SIZE = 200;

function clampPageSize(n) {
  const x = Number(n);
  if (!Number.isFinite(x) || x < 1) return 20;
  return Math.min(Math.floor(x), MAX_PAGE_SIZE);
}

function qs(params) {
  const s = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v != null && v !== "") s.set(k, String(v));
  });
  const str = s.toString();
  return str ? `?${str}` : "";
}

function entradaPayload(body) {
  const pid = Number(body.productoId ?? body.ProductoId);
  const cantidad = Number(body.cantidad ?? body.Cantidad ?? 0);
  const costoUnitario = Number(body.costoUnitario ?? body.CostoUnitario ?? 0);
  const observaciones = body.observaciones ?? body.Observaciones;
  const provRaw = body.proveedorId ?? body.ProveedorId;
  const numeroRef =
    body.numeroReferencia ??
    body.NumeroReferencia ??
    body.numeroFactura ??
    body.NumeroFactura;
  const varianteRaw = body.productoVarianteId ?? body.ProductoVarianteId;

  const out = {
    productoId: pid,
    cantidad,
    costoUnitario,
    ...(observaciones != null && String(observaciones).trim() !== ""
      ? { observaciones }
      : {}),
    ...(provRaw != null && provRaw !== "" ? { proveedorId: Number(provRaw) } : {}),
    ...(numeroRef != null && String(numeroRef).trim() !== ""
      ? { numeroReferencia: String(numeroRef).trim() }
      : {}),
    ...(varianteRaw != null && varianteRaw !== ""
      ? { productoVarianteId: Number(varianteRaw) }
      : {}),
  };
  return out;
}

function salidaPayload(body) {
  const pid = Number(body.productoId ?? body.ProductoId);
  const varianteRaw = body.productoVarianteId ?? body.ProductoVarianteId;
  const subRaw = body.subtipo ?? body.Subtipo;
  const subTrim = subRaw != null ? String(subRaw).trim() : "";
  return {
    productoId: pid,
    cantidad: Number(body.cantidad ?? body.Cantidad ?? 0),
    ...(body.observaciones != null && String(body.observaciones ?? body.Observaciones ?? "").trim() !== ""
      ? { observaciones: body.observaciones ?? body.Observaciones }
      : {}),
    /** Si no se envía o viene vacío, el backend usa "Salida manual". */
    ...(subTrim !== "" ? { subtipo: subTrim } : {}),
    ...(varianteRaw != null && varianteRaw !== ""
      ? { productoVarianteId: Number(varianteRaw) }
      : {}),
  };
}

function ajustePayload(body) {
  const pid = Number(body.productoId ?? body.ProductoId);
  const varianteRaw = body.productoVarianteId ?? body.ProductoVarianteId;
  const stockFisico = Number(
    body.stockFisicoReal ??
      body.StockFisicoReal ??
      body.cantidadNueva ??
      body.CantidadNueva ??
      body.cantidad ??
      body.Cantidad ??
      0
  );
  return {
    productoId: pid,
    stockFisicoReal: stockFisico,
    ...(body.observaciones != null && String(body.observaciones ?? body.Observaciones ?? "").trim() !== ""
      ? { observaciones: body.observaciones ?? body.Observaciones }
      : {}),
    ...(varianteRaw != null && varianteRaw !== ""
      ? { productoVarianteId: Number(varianteRaw) }
      : {}),
  };
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
 * MAPEO: Frontend (camelCase) -> Backend FormData (PascalCase).
 * Imagen (API v1 productos):
 * - Sin cambiar imagen: no enviar Imagen ni EliminarImagen.
 * - Foto nueva: parte Imagen (base64 -> archivo); no enviar EliminarImagen.
 * - Quitar foto: no enviar Imagen; EliminarImagen = "true" (vía body.eliminarImagen).
 * - Si hubiera archivo nuevo y flag, prevalece el archivo (no se envía EliminarImagen).
 */
function toBackendProduct(body) {
  if (!body) return body;
  if (body instanceof FormData) return body;

  const fd = new FormData();
  fd.append("Codigo", body.codigo || body.sku || "");
  fd.append("Nombre", body.nombre || "");
  if (body.descripcion != null && String(body.descripcion).trim() !== "") {
    fd.append("Descripcion", String(body.descripcion));
  }
  fd.append("Precio", Number(body.precioVenta || body.precio || 0));
  fd.append("PrecioCompra", Number(body.precioCompra || 0));
  fd.append("Talla", body.talla || "N/A");
  if (body.color != null && String(body.color).trim() !== "") {
    fd.append("Color", String(body.color));
  }
  const ctrl = Boolean(body.controlarStock);
  fd.append("StockActual", ctrl ? Number(body.stock || 0) : 0);
  fd.append("StockMinimo", ctrl ? Number(body.stockMinimo || 0) : 0);
  fd.append("CategoriaProductoId", Number(body.categoriaProductoId || 0));
  fd.append("ControlarStock", ctrl ? "true" : "false");
  fd.append("Activo", body.activo !== false ? "true" : "false");

  if (body.proveedorId) {
    fd.append("ProveedorId", Number(body.proveedorId));
  }

  let appendedNewImageFile = false;
  if (body.imagen) {
    const blob = base64ToBlob(body.imagen);
    if (blob) {
      fd.append("Imagen", blob, "producto.jpg");
      appendedNewImageFile = true;
    }
  }

  if (body.eliminarImagen === true && !appendedNewImageFile) {
    fd.append("EliminarImagen", "true");
  }

  return fd;
}

/** Normaliza variantes del API (listado/detalle producto). Reutilizado en POS. */
export function mapVariantesFromBackend(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((v) => ({
      id: Number(v?.id ?? v?.Id),
      talla: v?.talla ?? v?.Talla ?? "",
      color: v?.color ?? v?.Color ?? "",
      stock: Number(v?.stock ?? v?.Stock ?? 0),
      precioAdicional: Number(v?.precioAdicional ?? v?.PrecioAdicional ?? 0),
      sku: v?.sku ?? v?.Sku ?? "",
    }))
    .filter((v) => Number.isFinite(v.id) && v.id > 0);
}

/**
 * Unifica respuesta GET /productos: items mapeados + metadatos de paginación para la UI.
 * Acepta camelCase / PascalCase y respuestas sin total (se infiere por la última página).
 */
export function normalizeProductListResponse(raw, requestParams = {}) {
  const reqPage = Number(requestParams.page ?? 1) || 1;
  const reqSize = clampPageSize(requestParams.pageSize ?? MAX_PAGE_SIZE);

  if (Array.isArray(raw)) {
    const items = raw.map(fromBackendProduct);
    return {
      items,
      page: 1,
      pageSize: items.length,
      totalCount: items.length,
      totalPages: 1,
      totalCountFromServer: false,
    };
  }

  const itemsRaw = raw?.items ?? raw?.Items ?? [];
  const items = Array.isArray(itemsRaw) ? itemsRaw.map(fromBackendProduct) : [];

  const page = Number(raw?.page ?? raw?.Page ?? reqPage) || 1;
  const pageSize = Number(raw?.pageSize ?? raw?.PageSize ?? reqSize) || reqSize;

  const tcRaw = raw?.totalCount ?? raw?.TotalCount ?? raw?.total ?? raw?.Total;
  const totalCountFromServer =
    tcRaw != null && tcRaw !== "" && !Number.isNaN(Number(tcRaw));

  let totalCount = totalCountFromServer ? Number(tcRaw) : null;
  let totalPages = raw?.totalPages ?? raw?.TotalPages;
  if (totalPages != null && totalPages !== "") {
    totalPages = Number(totalPages);
  } else {
    totalPages = null;
  }

  if (totalCount != null && Number.isFinite(totalCount) && (totalPages == null || !Number.isFinite(totalPages)) && pageSize > 0) {
    totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  }

  if (totalPages == null) {
    if (items.length < pageSize) {
      totalPages = Math.max(1, page);
    } else {
      totalPages = page + 1;
    }
  }

  if (!totalCountFromServer) {
    if (items.length < pageSize) {
      totalCount = (page - 1) * pageSize + items.length;
    } else {
      totalCount = null;
    }
  }

  return {
    items,
    page,
    pageSize,
    totalCount,
    totalPages: Math.max(1, Number(totalPages) || 1),
    totalCountFromServer,
  };
}

export function fromBackendProduct(p) {
  if (!p) return p;
  const cat =
    p.categoriaProducto ||
    p.CategoriaProducto ||
    p.categoria ||
    p.Categoria ||
    null;
  const imagenRaw = p.imagenUrl || p.imagen || p.ImagenUrl || p.Imagen || "";
  return {
    id: p.id ?? p.Id,
    codigo: p.codigo || p.Codigo || "",
    nombre: p.nombre || p.Nombre || "",
    descripcion: p.descripcion || p.Descripcion || "",
    precioVenta: p.precio ?? p.Precio ?? 0,
    precioCompra: p.precioCompra ?? p.PrecioCompra ?? 0,
    stock: p.stockTotal ?? p.StockTotal ?? p.stockActual ?? p.StockActual ?? p.stock ?? 0,
    stockMinimo: p.stockMinimo ?? p.StockMinimo ?? 0,
    talla: p.talla || p.Talla || "",
    color: p.color || p.Color || "",
    imagen: resolveImagenUrl(typeof imagenRaw === "string" ? imagenRaw : ""),
    categoriaProductoId: p.categoriaProductoId ?? p.CategoriaProductoId ?? cat?.id ?? cat?.Id ?? "",
    categoriaNombre:
      cat?.nombre ||
      cat?.Nombre ||
      p.nombreCategoria ||
      p.NombreCategoria ||
      p.categoriaNombre ||
      "",
    proveedorId: p.proveedorId ?? p.ProveedorId ?? "",
    controlarStock: p.controlarStock ?? p.ControlarStock ?? false,
    activo: p.activo ?? p.Activo ?? true,
    variantes: mapVariantesFromBackend(p.variantes ?? p.Variantes),
    opcionesGrupos: p.opcionesGrupos ?? p.OpcionesGrupos ?? [],
  };
}

/**
 * Inventario (JWT Admin): rutas bajo `/api/v1/inventario`
 * - GET  /movimientos?desde=&hasta=&productoId=&tipo=&page=&pageSize=
 * - GET  /movimientos/exportar?desde=&hasta=&productoId=&tipo=
 * - POST /entrada | /salida | /ajuste
 */
export const productsApi = {
  list: async (params) => {
    const p = { ...(params || {}) };
    if (p.pageSize != null) p.pageSize = clampPageSize(p.pageSize);
    const raw = await api.get(`${base}${qs(p)}`);
    return normalizeProductListResponse(raw, p);
  },
  get: async (id) => fromBackendProduct(await api.get(`${base}/${id}`)),
  create: (body) => api.post(base, toBackendProduct(body)),
  /** Mismo cuerpo que create: multipart FormData (antes se rompía al hacer spread de FormData). */
  update: (id, body) => api.put(`${base}/${id}`, toBackendProduct(body)),
  delete: (id) => api.delete(`${base}/${id}`),

  /** Listado de movimientos de inventario (global o filtrado por productoId). API v1: `/api/v1/inventario/movimientos`. */
  movimientos: (params) => {
    const p = { ...(params || {}) };
    if (p.pageSize != null) p.pageSize = clampPageSize(p.pageSize);
    return api.get(`${inventarioBase}/movimientos${qs(p)}`);
  },
  /**
   * Descarga Excel de movimientos (mismos filtros que listado, sin paginación).
   * Requiere JWT Admin.
   */
  exportarMovimientosInventarioExcel: async (params) => {
    const p = { ...(params || {}) };
    delete p.page;
    delete p.pageSize;
    const q = qs(p);
    const blob = await fetchBlob(`${inventarioBase}/movimientos/exportar${q}`);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `movimientos_inventario_${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  },
  /** Entrada de stock (Admin). Cuerpo: productoId, productoVarianteId?, cantidad, costoUnitario, proveedorId?, numeroReferencia?, observaciones? */
  entradaStock: (body) => {
    const pl = entradaPayload(body);
    if (!Number.isFinite(pl.productoId) || pl.productoId <= 0) {
      throw new Error("productoId inválido.");
    }
    return api.post(`${inventarioBase}/entrada`, pl);
  },
  /** Salida: productoId, productoVarianteId?, cantidad, subtipo (motivo; omitir si vacío → backend "Salida manual"), observaciones? */
  salidaStock: (body) => api.post(`${inventarioBase}/salida`, salidaPayload(body)),
  /** Ajuste stock físico: productoId, productoVarianteId?, stockFisicoReal, observaciones? */
  ajusteStock: (body) => api.post(`${inventarioBase}/ajuste`, ajustePayload(body)),

  /**
   * Entrada mínima por id + cantidad (p. ej. `useProducts`). Recarga el producto tras el movimiento.
   */
  restock: async (productoId, cantidad) => {
    const pl = entradaPayload({ productoId, cantidad, costoUnitario: 0 });
    if (!Number.isFinite(pl.productoId) || pl.productoId <= 0) {
      throw new Error("productoId inválido.");
    }
    await api.post(`${inventarioBase}/entrada`, pl);
    return fromBackendProduct(await api.get(`${base}/${productoId}`));
  },
};
