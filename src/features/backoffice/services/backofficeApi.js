import { 
  api,
  productsApi, 
  cajaApi, 
  authApi, 
  dashboardApi, 
  reportsApi, 
  posApi, 
  ventasApi,
  usersApi, 
  settingsApi,
  clientsApi
} from "../../../api/index.js";

/**
 * Puente de Servicios (Real): Conecta la UI con el Backend de producción.
 * Mantiene los nombres de funciones originales para asegurar la compatibilidad ("Zero Errors").
 */
export const backofficeApi = {
  // Auth & Session
  login: (u, p) => authApi.login(u, p),
  me: () => authApi.me(),

  // Productos
  listProductos: (params) => productsApi.list(params),
  getProducto: (id) => productsApi.get(id),
  createProducto: (body) => productsApi.create(body),
  updateProducto: (id, body) => productsApi.update(id, body),
  deleteProducto: (id) => productsApi.delete(id),

  // Caja
  cajaEstado: () => cajaApi.estado(),
  cajaApertura: (monto) => cajaApi.apertura(monto),
  cajaAbrir: (monto) => cajaApi.apertura(monto),
  cajaCerrar: (body) => cajaApi.cierre(body),
  cajaCierrePreview: () => cajaApi.cierrePreview(),
  cajaHistorial: (params) => cajaApi.historial(params),
  cajaDetalleCierre: async (id) => {
    // El backend puede exponer este detalle con distintos paths según versión.
    // Probamos opciones comunes; si falla, devolvemos null y la UI muestra mensaje.
    const cid = id == null ? "" : String(id);
    if (!cid) return null;
    try {
      return await api.get(`/api/v1/caja/cierres/${cid}`);
    } catch {
      try {
        return await api.get(`/api/v1/caja/historial/${cid}`);
      } catch {
        return null;
      }
    }
  },

  // POS & Venta
  posOrdenes: (body) => posApi.ventas(body),
  ventasList: (params) => ventasApi.list(params),
  ventasGet: (id) => ventasApi.get(id),
  ventasTicketPdf: (id) => ventasApi.ticketPdf(id),
  /** Retail: no hay mesa; se ignora el id y no hay orden persistente en servidor. */
  getMesaOrdenActiva: (_mesaId) => Promise.resolve(null),
  // Detalle de venta/orden para modales de reportes (si el backend lo soporta).
  getPedido: async (id) => {
    const sid = id == null ? "" : String(id);
    if (!sid) return null;
    // Intento 1: endpoint típico de ventas (retail)
    try {
      return await api.get(`/api/v1/ventas/${sid}`);
    } catch {
      // Intento 2: algunos backends exponen facturas/ordenes bajo /api/v1/pos/ventas/{id}
      try {
        return await api.get(`/api/v1/pos/ventas/${sid}`);
      } catch {
        return null;
      }
    }
  },
  getDeliveryPedido: async (id) => {
    // En retail normalmente no hay "delivery" separado; usamos el mismo fallback.
    return await backofficeApi.getPedido(id);
  },
  posCancelarOrden: () => Promise.resolve(), // Vaciado de carrito local

  ventasProcesarPago: (body) => ventasApi.procesarPago(body),
  ventasGestionarPago: (body) => ventasApi.gestionarPago(body),

  // Catálogos
  catalogoCategoriasProducto: () => api.get("/api/v1/catalogos/categorias-producto"),
  catalogoProveedores: () => api.get("/api/v1/catalogos/proveedores"),

  // Dashboard & Reportes
  dashboardResumen: (params) => dashboardApi.resumen(params),
  reportesResumenVentas: (params) => reportsApi.salesSummary(params),
  reportesResumenVentasDetalle: (params) => reportsApi.salesDetail(params),
  /** Líneas de un ticket cobrado (retail POS). Requiere rol Admin. */
  reportesVentaTicketDetalle: (ventaId) => reportsApi.ventaTicketDetalle(ventaId),
  reportesExportarResumenVentasExcel: (params) => reportsApi.downloadResumenVentasExcel(params),
  reportesExportarVentasDetalleExcel: (params) => reportsApi.downloadResumenVentasDetalleExcel(params),
  reportesVentasPorVendedor: (params) => reportsApi.salesBySeller(params),
  reportesExportarVentasPorVendedorExcel: (params) => reportsApi.downloadVentasPorVendedorExcel(params),
  reportesProductosTop: (params) => reportsApi.topProducts(params),
  reportesVentasPorCategoria: (params) => reportsApi.salesByCategory(params),
  reportesVentasPorCategoriaDesglose: (params) => reportsApi.ventasPorCategoriaDesglose(params),
  reportesExportarVentasPorCategoriaDesgloseExcel: (params) =>
    reportsApi.downloadVentasPorCategoriaDesgloseExcel(params),

  // Inventario / movimientos de stock (API de productos)
  movimientosProductos: (params) => productsApi.movimientos(params),
  movimientosProducto: async (productoId, params = {}) => {
    const raw = await productsApi.movimientos({
      productoId,
      pageSize: params.limite ?? params.pageSize ?? 50,
      page: params.page ?? 1,
    });
    const items =
      raw?.items ??
      raw?.Items ??
      raw?.movimientos ??
      raw?.Movimientos ??
      (Array.isArray(raw) ? raw : []);
    return { movimientos: Array.isArray(items) ? items : [] };
  },
  entradaStockProducto: (body) => productsApi.entradaStock(body),
  salidaStockProducto: (body) => productsApi.salidaStock(body),
  ajusteStockProducto: (body) => productsApi.ajusteStock(body),
  /** Excel de movimientos (Admin); mismos filtros opcionales que el listado (sin page). */
  exportarMovimientosInventarioExcel: (params) =>
    productsApi.exportarMovimientosInventarioExcel(params),
  
  // Usuarios
  listUsuarios: (params) => usersApi.list(params),
  createUsuario: (body) => usersApi.create(body),
  updateUsuario: (id, body) => usersApi.update(id, body),
  deleteUsuario: (id) => usersApi.delete(id),

  // Categorías
  listCategorias: () => api.get("/api/v1/catalogos/categorias-producto"),
  catalogoCategorias: () => api.get("/api/v1/catalogos/categorias-producto"),
  getCategoriaProducto: (id) => api.get(`/api/v1/catalogos/categorias-producto/${id}`),
  createCategoria: (body) => api.post("/api/v1/catalogos/categorias-producto", body),
  updateCategoria: (id, body) => api.put(`/api/v1/catalogos/categorias-producto/${id}`, body),
  deleteCategoria: (id) => api.delete(`/api/v1/catalogos/categorias-producto/${id}`),
  saveCategoria: (body) => (body.id ? api.put(`/api/v1/catalogos/categorias-producto/${body.id}`, body) : api.post("/api/v1/catalogos/categorias-producto", body)),

  // Proveedores
  listProveedores: () => api.get("/api/v1/catalogos/proveedores"),
  getProveedor: (id) => api.get(`/api/v1/catalogos/proveedores/${id}`),
  createProveedor: (body) => api.post("/api/v1/catalogos/proveedores", body),
  updateProveedor: (id, body) => api.put(`/api/v1/catalogos/proveedores/${id}`, body),
  deleteProveedor: (id) => api.delete(`/api/v1/catalogos/proveedores/${id}`),
  saveProveedor: (body) => (body.id ? api.put(`/api/v1/catalogos/proveedores/${body.id}`, body) : api.post("/api/v1/catalogos/proveedores", body)),

  // Plantillas WhatsApp
  listPlantillasWhatsapp: (params) => {
    const s = new URLSearchParams();
    Object.entries(params || {}).forEach(([k, v]) => {
      if (v != null && v !== "") s.set(k, String(v));
    });
    const q = s.toString();
    return api.get(`/api/v1/configuraciones/plantillas-whatsapp${q ? `?${q}` : ""}`);
  },
  getPlantillaWhatsapp: (id) => api.get(`/api/v1/configuraciones/plantillas-whatsapp/${id}`),
  createPlantillaWhatsapp: (body) => api.post("/api/v1/configuraciones/plantillas-whatsapp", body),
  updatePlantillaWhatsapp: (id, body) => api.put(`/api/v1/configuraciones/plantillas-whatsapp/${id}`, body),
  deletePlantillaWhatsapp: (id) => api.delete(`/api/v1/configuraciones/plantillas-whatsapp/${id}`),
  marcarDefaultPlantillaWhatsapp: (id) => api.patch(`/api/v1/configuraciones/plantillas-whatsapp/${id}/marcar-default`),

  // Clientes
  listClientes: (params) => clientsApi.list(params),
  saveCliente: (body) => clientsApi.save(body),
  deleteCliente: (id) => clientsApi.delete(id),

  // Configuración
  configuraciones: () => settingsApi.list(),
  configuracionTipoCambio: () => api.get("/api/v1/configuraciones/tipo-cambio"),
  updateTipoCambio: (val) => api.put("/api/v1/configuraciones/tipo-cambio", { tipoCambioDolar: val }),
  upsertConfiguracion: (clave, valor, descripcion) => {
    const body = { valor };
    if (descripcion != null && String(descripcion).trim() !== "") {
      body.descripcion = descripcion;
    }
    return api.put(`/api/v1/configuraciones/${encodeURIComponent(clave)}`, body);
  },

  /** Grupos de opciones de producto (tallas/extras); si el endpoint no existe, devuelve []. */
  listProductoOpcionesGrupos: async (productoId) => {
    const id = productoId == null ? "" : String(productoId);
    if (!id) return [];
    try {
      return await api.get(`/api/v1/productos/${id}/opciones-grupos`);
    } catch {
      return [];
    }
  },
};
