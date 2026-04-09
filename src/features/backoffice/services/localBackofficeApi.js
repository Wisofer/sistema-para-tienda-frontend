const storage = {
  get: (key) => {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : null;
  },
  set: (key, val) => localStorage.setItem(key, JSON.stringify(val)),
};

// Force refresh keys to ensure new structure is loaded
const DB_VERSION = "v6";
const PRODUCTS_CACHE_KEY = `pos-${DB_VERSION}-products`;
const SALES_CACHE_PREFIX = `pos-${DB_VERSION}-sales-history`;
const CATEGORIES_CACHE_KEY = `pos-${DB_VERSION}-categories`;
const PROVIDERS_CACHE_KEY = `pos-${DB_VERSION}-providers`;
const CLIENTS_CACHE_KEY = `pos-${DB_VERSION}-clients`;
const USERS_CACHE_KEY = `pos-${DB_VERSION}-users`;
const CAJA_STATE_KEY = `pos-${DB_VERSION}-caja-estado`;
const ACTIVE_ORDERS_KEY = `pos-${DB_VERSION}-active-orders`;

const MOCK_CATEGORIES = [
  { id: 1, nombre: "Ropa", descripcion: "Prendas de vestir para damas y caballeros" },
  { id: 2, nombre: "Calzado", descripcion: "Zapatos, tenis y sandalias" },
  { id: 3, nombre: "Accesorios", descripcion: "Relojes, bolsos y joyería" },
  { id: 4, nombre: "Perfumería", descripcion: "Fragancias nacionales e importadas" },
];

const MOCK_PROVIDERS = [
  { id: 1, nombre: "Distribuidora Moda", contacto: "Juan Pérez", telefono: "8888-0001", email: "ventas@moda.com", direccion: "Managua, Nicaragua", activo: true, estado: "Activo" },
  { id: 2, nombre: "Calzado Premium SA", contacto: "Maria Lopez", telefono: "8888-0002", email: "m.lopez@premium.com", direccion: "Granada, Nicaragua", activo: true, estado: "Activo" },
];

const MOCK_CLIENTS = [
  { id: 1, nombre: "Cliente General", ruc: "000-000000-0000X", telefono: "0000-0000", email: "general@tienda.com", direccion: "N/A", activo: true },
  { id: 2, nombre: "William Borge", ruc: "123-456789-0001A", telefono: "8888-9999", email: "william@gmail.com", direccion: "Managua", activo: true },
  { id: 3, nombre: "Ana García", ruc: "888-121290-0005B", telefono: "7777-1111", email: "ana.g@outlook.com", direccion: "Leon", activo: true },
];

const MOCK_USERS = [
  { id: 1, nombre: "Administrador", username: "admin", rol: "Admin", activo: true, email: "admin@tienda.com" },
  { id: 2, nombre: "Vendedor 1", username: "vendedor", rol: "Ventas", activo: true, email: "ventas1@tienda.com" },
];

const MOCK_PRODUCTS = [
  // Ropa (Con Variantes)
  { 
    id: 101, 
    categoriaProductoId: 1, 
    nombre: "Blusa Casual Mujer", 
    precioVenta: 450, 
    stock: 45, 
    stockMinimo: 5, 
    controlarStock: true, 
    imagen: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&q=80", 
    codigo: "R001",
    variantes: [
      { id: 1011, talla: "S", color: "Blanco", stock: 20, sku: "R001-S", precioAdicional: 0 },
      { id: 1012, talla: "M", color: "Blanco", stock: 25, sku: "R001-M", precioAdicional: 0 }
    ]
  },
  { 
    id: 102, 
    categoriaProductoId: 1, 
    nombre: "Camisa Polo Azul", 
    precioVenta: 550, 
    stock: 32, 
    stockMinimo: 8, 
    controlarStock: true, 
    imagen: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&q=80", 
    codigo: "R002",
    variantes: [
      { id: 1021, talla: "L", color: "Azul", stock: 15, sku: "R002-L", precioAdicional: 0 },
      { id: 1022, talla: "XL", color: "Azul", stock: 17, sku: "R002-XL", precioAdicional: 50 }
    ]
  },
  { id: 103, categoriaProductoId: 1, nombre: "Jeans Slim Fit", precioVenta: 850, stock: 28, stockMinimo: 10, controlarStock: true, talla: "32", color: "Denim", imagen: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&q=80", codigo: "R003" },
  { id: 104, categoriaProductoId: 1, nombre: "Vestido Floral", precioVenta: 950, stock: 15, stockMinimo: 3, controlarStock: true, talla: "S", color: "Multicolor", imagen: "https://images.unsplash.com/photo-1572804013307-59c8558dc07a?w=400&q=80", codigo: "R004" },
  { id: 105, categoriaProductoId: 1, nombre: "Camiseta Básica Blanca", precioVenta: 250, stock: 60, stockMinimo: 15, controlarStock: true, talla: "XL", color: "Blanco", imagen: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400&q=80", codigo: "R005" },

  // Calzado (Ejemplos planos para compatibilidad)
  { id: 201, categoriaProductoId: 2, nombre: "Tenis Running Star", precioVenta: 1200, stock: 12, stockMinimo: 5, controlarStock: true, talla: "40", color: "Rojo", imagen: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=400", codigo: "C001" },
  { id: 202, categoriaProductoId: 2, nombre: "Zapatos Casual Hombre", precioVenta: 1500, stock: 8, stockMinimo: 3, controlarStock: true, talla: "42", color: "Café", imagen: "https://images.unsplash.com/photo-1531310197839-ccf54634509e?auto=format&fit=crop&q=80&w=400", codigo: "C002" },
  { id: 311, categoriaProductoId: 3, nombre: "Lentes de Sol", precioVenta: 450, stock: 18, stockMinimo: 4, controlarStock: true, talla: "U", color: "Negro", imagen: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&q=80&w=400", codigo: "A004" },
  { id: 401, categoriaProductoId: 4, nombre: "Perfume Floral Rose", precioVenta: 1350, stock: 12, stockMinimo: 3, controlarStock: true, talla: "100ml", color: "Rosa", imagen: "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&q=80&w=400", codigo: "P001" },
  { id: 402, categoriaProductoId: 4, nombre: "Perfume Black Night", precioVenta: 1600, stock: 8, stockMinimo: 2, controlarStock: true, talla: "100ml", color: "Negro", imagen: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&q=80&w=400", codigo: "P002" },
  { id: 403, categoriaProductoId: 4, nombre: "Fragancia Elegance", precioVenta: 1100, stock: 5, stockMinimo: 2, controlarStock: true, talla: "50ml", color: "Transparente", imagen: "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=400", codigo: "P003" },
];

function generateHistoricalSales() {
  const sales = [];
  const getRandomItems = () => {
    const count = Math.floor(Math.random() * 3) + 1;
    const items = [];
    for (let i = 0; i < count; i++) {
      const p = MOCK_PRODUCTS[Math.floor(Math.random() * MOCK_PRODUCTS.length)];
      const qty = Math.floor(Math.random() * 2) + 1;
      items.push({
        id: Math.random(),
        productoId: p.id,
        nombre: p.nombre,
        precioOriginal: p.precioVenta,
        precio: p.precioVenta,
        cantidad: qty,
        total: p.precioVenta * qty
      });
    }
    return items;
  };
  const months = [
    { m: 0, count: 12 }, // Jan
    { m: 1, count: 15 }, // Feb
    { m: 2, count: 18 }, // Mar
  ];
  months.forEach(({ m, count }) => {
    for (let i = 0; i < count; i++) {
        const day = Math.floor(Math.random() * 28) + 1;
        const date = new Date(2026, m, day, 10 + (i % 8), Math.floor(Math.random() * 59));
        const detalles = getRandomItems();
        const total = detalles.reduce((acc, d) => acc + d.total, 0);
        sales.push({
            id: sales.length + 1000,
            fecha: date.toISOString(),
            total,
            subtotal: total,
            montoTotal: total,
            metodoPago: Math.random() > 0.3 ? "Efectivo" : "Tarjeta",
            detalles,
            numeroFactura: `FAC-${sales.length + 1000}`,
            cajero: "Administrador"
        });
    }
  });
  return sales;
}

function initialize() {
  const keys = [PRODUCTS_CACHE_KEY, CATEGORIES_CACHE_KEY, PROVIDERS_CACHE_KEY, CLIENTS_CACHE_KEY, USERS_CACHE_KEY, SALES_CACHE_PREFIX, CAJA_STATE_KEY];
  if (!localStorage.getItem(PRODUCTS_CACHE_KEY)) {
      storage.set(PRODUCTS_CACHE_KEY, MOCK_PRODUCTS);
      storage.set(CATEGORIES_CACHE_KEY, MOCK_CATEGORIES);
      storage.set(PROVIDERS_CACHE_KEY, MOCK_PROVIDERS);
      storage.set(CLIENTS_CACHE_KEY, MOCK_CLIENTS);
      storage.set(USERS_CACHE_KEY, MOCK_USERS);
      storage.set(SALES_CACHE_PREFIX, generateHistoricalSales());
      storage.set(CAJA_STATE_KEY, { abierta: true, montoApertura: 2000, fechaApertura: new Date().toISOString(), estado: "Abierto" });
  }
}

initialize();

const crud = (key) => ({
    list: async (params = {}) => {
        let items = storage.get(key) || [];
        if (params.search) {
            const q = params.search.toLowerCase();
            items = items.filter(i => (i.nombre || i.username || "").toLowerCase().includes(q) || (i.ruc || i.codigo || "").toLowerCase().includes(q));
        }
        return { items, total: items.length };
    },
    get: async (id) => {
        const items = storage.get(key) || [];
        return items.find(i => String(i.id) === String(id));
    },
    save: async (idOrData, dataIfId) => {
        const items = storage.get(key) || [];
        let finalData = dataIfId ? { ...dataIfId, id: idOrData } : idOrData;
        
        if (finalData.id) {
            const idx = items.findIndex(i => String(i.id) === String(finalData.id));
            if (idx !== -1) items[idx] = { ...items[idx], ...finalData };
            else items.push(finalData);
        } else {
            finalData.id = Date.now();
            finalData.activo = true;
            items.push(finalData);
        }
        storage.set(key, items);
        return finalData;
    },
    delete: async (id) => {
        const items = storage.get(key) || [];
        storage.set(key, items.filter(i => String(i.id) !== String(id)));
        return { success: true };
    }
});

const productCrud = crud(PRODUCTS_CACHE_KEY);
const categoryCrud = crud(CATEGORIES_CACHE_KEY);
const providerCrud = crud(PROVIDERS_CACHE_KEY);
const clientCrud = crud(CLIENTS_CACHE_KEY);
const userCrud = crud(USERS_CACHE_KEY);

export const localBackofficeApi = {
  // Auth & CRUD
  login: async (credentials) => {
    if (credentials.username === "admin" && credentials.password === "admin") return { token: "static-token", user: MOCK_USERS[0] };
    throw new Error("Credenciales inválidas (admin/admin)");
  },
  listProductos: productCrud.list, getProducto: productCrud.get, saveProducto: productCrud.save, createProducto: productCrud.save, updateProducto: productCrud.save, deleteProducto: productCrud.delete,
  exportarInventarioProductosExcel: async () => {},
  listCategorias: categoryCrud.list, getCategoriaProducto: (id) => categoryCrud.get(id), saveCategoria: categoryCrud.save, createCategoria: categoryCrud.save, updateCategoria: categoryCrud.save, deleteCategoria: categoryCrud.delete, catalogoCategorias: async () => storage.get(CATEGORIES_CACHE_KEY), catalogoCategoriasProducto: async () => storage.get(CATEGORIES_CACHE_KEY),
  listProveedores: providerCrud.list, getProveedor: providerCrud.get, saveProveedor: providerCrud.save, createProveedor: providerCrud.save, updateProveedor: providerCrud.save, deleteProveedor: providerCrud.delete, catalogoProveedores: async () => storage.get(PROVIDERS_CACHE_KEY),
  listClientes: clientCrud.list, saveCliente: clientCrud.save, deleteCliente: clientCrud.delete,
  listUsuarios: userCrud.list, saveUsuario: userCrud.save, createUsuario: userCrud.save, updateUsuario: userCrud.save, deleteUsuario: userCrud.delete,

  // Dashboard
  dashboardResumen: async () => {
    const products = storage.get(PRODUCTS_CACHE_KEY) || [];
    const sales = storage.get(SALES_CACHE_PREFIX) || [];
    const today = new Date().toISOString().split("T")[0];
    const todaysSales = sales.filter(s => s.fecha && s.fecha.startsWith(today));
    const totalVentasHoy = todaysSales.reduce((acc, s) => acc + (s.total || 0), 0);
    const ventasMesActual = sales.filter(s => s.fecha && s.fecha.includes("-04-")).reduce((acc, s) => acc + (s.total || 0), 0);
    const seriesMap = { "01": 0, "02": 0, "03": 0, "04": 0 };
    sales.forEach(s => { const m = s.fecha.split("-")[1]; if (seriesMap[m] !== undefined) seriesMap[m] += s.total; });
    const series = [ { label: "2026-01-01", total: seriesMap["01"] }, { label: "2026-02-01", total: seriesMap["02"] }, { label: "2026-03-01", total: seriesMap["03"] }, { label: "2026-04-01", total: seriesMap["04"] } ];
    return {
      kpis: { totalOrdenesHoy: todaysSales.length, totalVentasHoy: totalVentasHoy, ticketPromedioHoy: todaysSales.length > 0 ? totalVentasHoy / todaysSales.length : 0, ventasMes: ventasMesActual, ventasSemana: ventasMesActual * 0.3, totalCajaHoy: 2000 + totalVentasHoy },
      topProductos: products.slice(0, 5).map(p => ({ nombre: p.nombre, cantidad: Math.floor(Math.random() * 50) + 10, venta: p.precioVenta * 10 })).sort((a,b) => b.venta - a.venta),
      serieVentas: series,
      ventasPorCategoria: MOCK_CATEGORIES.map(c => ({ nombreCategoria: c.nombre, total: Math.random() * 5000 + 1000 })),
      productosStockBajoLista: products.filter(p => p.stock <= p.stockMinimo),
      totalProductos: products.length, rango: { desde: "2026-01-01", hasta: today }
    };
  },

  // Stock
  entradaStockProducto: async () => ({ success: true }), salidaStockProducto: async () => ({ success: true }), ajusteStockProducto: async () => ({ success: true }), movimientosProducto: async () => ({ items: [] }), movimientosProductos: async () => ({ items: [] }), exportarMovimientosInventarioExcel: async () => {},

  // Caja
  cajaEstado: async () => storage.get(CAJA_STATE_KEY),
  cajaAbrir: async (monto) => { const s = { abierta: true, montoApertura: monto, fechaApertura: new Date().toISOString(), estado: "Abierto" }; storage.set(CAJA_STATE_KEY, s); return s; },
  cajaCierre: async () => { const s = { abierta: false, estado: "Cerrado" }; storage.set(CAJA_STATE_KEY, s); return s; },
  cajaCierrePreview: async () => ({ ventasEfectivo: 5000, ventasTarjeta: 0, totalVentas: 5000, montoApertura: 2000 }),
  cajaDetalleCierre: async (id) => ({
    id: id ?? 1,
    fechaHoraCierre: new Date().toISOString(),
    estado: "Cerrado",
    montoInicial: 1000,
    totalGeneral: 500,
    totalEfectivo: 400,
    totalTarjeta: 100,
    totalTransferencia: 0,
    montoEsperado: 1400,
    montoReal: 1395,
    diferencia: -5,
    observaciones: "",
    usuario: "Demo",
  }),
  cajaHistorial: async () => ({ items: [] }),
  exportarCajaHistorialExcel: async () => {},

  // Venta
  ventasProcesarPago: async (body) => {
    const sales = storage.get(SALES_CACHE_PREFIX) || [];
    const products = storage.get(PRODUCTS_CACHE_KEY) || [];
    const detalles = body.detalles || [];
    detalles.forEach(d => {
      const idx = products.findIndex(p => p.id === d.productoId);
      if (idx === -1) return;
      const p = products[idx];
      let descontadoEnVariante = false;
      if (d.varianteId && p.variantes) {
        const vIdx = p.variantes.findIndex(v => v.id === d.varianteId);
        if (vIdx !== -1) {
          p.variantes[vIdx].stock = Math.max(0, p.variantes[vIdx].stock - d.cantidad);
          descontadoEnVariante = true;
        }
      }
      // Stock agregado del producto: solo si no se descontó ya en la variante (evita −2 por línea en mock)
      if (p.controlarStock && !descontadoEnVariante) {
        p.stock = Math.max(0, p.stock - d.cantidad);
      }
    });
    const newSale = { id: Date.now(), fecha: new Date().toISOString(), total: body.montoPagado, montoTotal: body.montoPagado, metodoPago: body.tipoPago, detalles, numeroFactura: `FAC-${sales.length + 1001}`, vuelto: body.vueltoCordobas, cajero: "Administrador" };
    storage.set(SALES_CACHE_PREFIX, [newSale, ...sales]);
    storage.set(PRODUCTS_CACHE_KEY, products);
    return { ...newSale, success: true };
  },
  ventasGestionarPago: async (p) => localBackofficeApi.ventasProcesarPago(p),
  posOrdenes: async (body) => {
    const orders = storage.get(ACTIVE_ORDERS_KEY) || {};
    const id = body.ordenId || Date.now();
    orders[id] = { id, ...body, fecha: new Date().toISOString() };
    storage.set(ACTIVE_ORDERS_KEY, orders);
    return { id };
  },
  posCancelarOrden: async (id) => {
    const orders = storage.get(ACTIVE_ORDERS_KEY) || {};
    delete orders[id];
    storage.set(ACTIVE_ORDERS_KEY, orders);
    return { success: true };
  },
  getMesaOrdenActiva: async (mesaId) => {
    const orders = storage.get(ACTIVE_ORDERS_KEY) || {};
    return Object.values(orders).find(o => String(o.mesaId) === String(mesaId));
  },
  getPedido: async (id) => {
    const active = (storage.get(ACTIVE_ORDERS_KEY) || {})[id];
    if (active) {
        const products = storage.get(PRODUCTS_CACHE_KEY) || [];
        const total = (active.productos || []).reduce((acc, current) => {
            const prod = products.find(p => p.id === current.productoId);
            return acc + (current.cantidad * (prod?.precioVenta || prod?.precio || 0));
        }, 0);
        return { ...active, montoTotal: total, subtotal: total, total };
    }
    return (storage.get(SALES_CACHE_PREFIX) || []).find(s => String(s.id) === String(id));
  },
  getDeliveryPedido: async () => null,

  // Config & Reports
  configuracionTipoCambio: async () => ({ valor: 36.8, tipoCambioDolar: 36.8 }), updateTipoCambio: async () => ({ success: true }),
  configuraciones: async () => ([{ clave: "portal_tagline", valor: "Sistema de Facturación e Inventario" }, { clave: "moneda_principal", valor: "C$" }]), upsertConfiguracion: async () => ({ success: true }),
  reportesResumenVentas: async () => { const s = storage.get(SALES_CACHE_PREFIX) || []; return { items: s, total: s.length, montoTotal: s.reduce((a, b) => a + b.total, 0) }; },
  reportesResumenVentasDetalle: async () => ({ items: (storage.get(SALES_CACHE_PREFIX) || []) }),
  reportesVentaTicketDetalle: async (id) => {
    const sales = storage.get(SALES_CACHE_PREFIX) || [];
    const s = sales.find((x) => String(x.id) === String(id));
    if (!s) {
      return { lineas: [], totalCobrado: 0, subtotalLineas: 0, cantidadLineas: 0, cantidadUnidades: 0 };
    }
    const detalles = s.detalles || [];
    const lineas = detalles.map((d, idx) => ({
      detalleId: d.detalleId ?? d.id ?? idx + 1,
      productoNombre: d.nombreProducto || d.productoNombre || "Producto",
      cantidad: d.cantidad,
      precioUnitario: d.precioUnitario,
      subtotal: d.subtotal ?? d.cantidad * d.precioUnitario,
      anulado: Boolean(d.anulado),
    }));
    return {
      ventaId: s.id,
      numeroTicket: s.numeroFactura,
      fecha: s.fecha,
      lineas,
      subtotalLineas: s.total,
      totalCobrado: s.total,
      cantidadLineas: lineas.length,
      cantidadUnidades: lineas.reduce((a, l) => a + l.cantidad, 0),
    };
  },
  reportesExportarResumenVentasExcel: async () => {},
  reportesExportarVentasDetalleExcel: async () => {},
  reportesProductosTop: async () => (storage.get(PRODUCTS_CACHE_KEY) || []).slice(0, 10).map(p => ({ nombre: p.nombre, cantidad: 50, total: p.precioVenta * 50 })),
  reportesVentasPorCategoria: async () => [], reportesVentasPorMesero: async () => ({ items: [] }),
  reportesVentasPorCategoriaDesglose: async () => ({
    totalCategorias: 1,
    items: [
      {
        categoria: "Ropa",
        monto: 200,
        cantidad: 2,
        productos: [
          {
            productoId: 101,
            codigoProducto: "R001",
            productoNombre: "Camisa demo",
            cantidad: 2,
            monto: 200,
          },
        ],
      },
    ],
  }),
  reportesExportarVentasPorCategoriaDesgloseExcel: async () => {},
  reportesVentasPorVendedor: async () => ({
    desde: "",
    hasta: "",
    total: 0,
    items: [],
  }),
  reportesExportarVentasPorVendedorExcel: async () => {},
  reportesExportarProductosTopExcel: async () => {},

  ventaCancelar: async () => ({ success: true, message: "Venta anulada (demo)" }),
  ventaCancelarParcial: async () => ({ success: true, message: "Devolución registrada (demo)" }),

  // Whatsapp stubs
  listPlantillasWhatsapp: async () => ({ items: [] }), getPlantillaWhatsapp: async () => ({}), createPlantillaWhatsapp: async () => ({}), updatePlantillaWhatsapp: async () => ({}), deletePlantillaWhatsapp: async () => ({}), marcarDefaultPlantillaWhatsapp: async () => ({}),
};

export const backofficeApi = localBackofficeApi;
