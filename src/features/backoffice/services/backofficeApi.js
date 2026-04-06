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
  cajaDetalleCierre: (id) => Promise.resolve({ total: 0 }), 

  // POS & Venta
  posOrdenes: (body) => posApi.ventas(body),
  getMesaOrdenActiva: () => Promise.resolve(null),
  getPedido: (id) => Promise.resolve(null), // Retail usa carrito local para checkout
  posCancelarOrden: () => Promise.resolve(), // Vaciado de carrito local

  ventasProcesarPago: (body) => ventasApi.procesarPago(body),
  ventasGestionarPago: (body) => ventasApi.gestionarPago(body),

  // Catálogos
  catalogoCategoriasProducto: () => api.get("/api/v1/catalogos/categorias-producto"),
  catalogoProveedores: () => api.get("/api/v1/catalogos/proveedores"),

  // Dashboard & Reportes
  dashboardResumen: () => dashboardApi.resumen(),
  reportesResumenVentas: (params) => reportsApi.salesSummary(params),
  reportesResumenVentasDetalle: (params) => reportsApi.salesDetail(params),
  reportesVentasPorVendedor: (params) => reportsApi.salesBySeller(params),
  reportesProductosTop: (params) => reportsApi.topProducts(params),
  reportesVentasPorCategoria: (params) => reportsApi.salesByCategory(params),
  movimientosProductos: (params) => reportsApi.inventoryMovements(params),
  
  // Usuarios
  listUsuarios: (params) => usersApi.list(params),
  createUsuario: (body) => usersApi.create(body),
  updateUsuario: (id, body) => usersApi.update(id, body),
  deleteUsuario: (id) => usersApi.delete(id),

  // Categorías
  listCategorias: () => api.get("/api/v1/catalogos/categorias-producto"),
  catalogoCategorias: () => api.get("/api/v1/catalogos/categorias-producto"),
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
  listPlantillasWhatsapp: () => api.get("/api/v1/configuraciones/plantillas-whatsapp"),
  getPlantillaWhatsapp: (id) => api.get(`/api/v1/configuraciones/plantillas-whatsapp/${id}`),
  createPlantillaWhatsapp: (body) => api.post("/api/v1/configuraciones/plantillas-whatsapp", body),
  updatePlantillaWhatsapp: (id, body) => api.put(`/api/v1/configuraciones/plantillas-whatsapp/${id}`, body),
  deletePlantillaWhatsapp: (id) => api.delete(`/api/v1/configuraciones/plantillas-whatsapp/${id}`),
  marcarDefaultPlantillaWhatsapp: (id) => api.patch(`/api/v1/configuraciones/plantillas-whatsapp/${id}/marcar-default`),

  // Clientes
  listClientes: (params) => clientsApi.list(params),
  saveCliente: (body) => clientsApi.save(body),

  // Configuración
  configuraciones: () => settingsApi.list(),
  configuracionTipoCambio: () => api.get("/api/v1/configuraciones/tipo-cambio"),
  updateTipoCambio: (val) => api.put("/api/v1/configuraciones/tipo-cambio", { tipoCambioDolar: val }),
  upsertConfiguracion: (clave, valor) => api.put(`/api/v1/configuraciones/${clave}`, { valor }),

  listProductoOpcionesGrupos: () => Promise.resolve([]),
};
