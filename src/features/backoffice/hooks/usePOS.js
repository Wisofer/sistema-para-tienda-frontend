import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { backofficeApi } from "../services/backofficeApi.js";
import { useSnackbar } from "../../../contexts/SnackbarContext.jsx";
import { useAuth } from "../../../contexts/AuthContext.jsx";
import { PAGINATION } from "../constants/pagination.js";
import {
  extractPosOrdenResponseId,
  getOrdenItems,
  getOrdenPedidoId,
  getPedidoMontoNumeric,
  mapBackendItemsToCart,
  posCartToModalLines,
  posCartToRetailItems,
  unwrapEnvelope,
} from "../utils/posPedido.js";
import { fetchPosProductosYCategorias } from "../utils/posCatalogLoad.js";
import { openBackendPrintHtml } from "../utils/backofficePrint.js";
import { 
  genPosLineId, 
  productoTieneOpcionesVisibles, 
  getSingleGrupoOpcionesForPosInline,
  withOpcionesNormalizadas
} from "../utils/productoOpciones.js";
import { POS_ORDER_VIRTUAL_ID, calculateSubtotal, filterPosProducts } from "../utils/posUtils.js";

/**
 * Hook personalizado para manejar la lógica del Punto de Venta (POS).
 */
export function usePOS(currencySymbol = "C$") {
  const snackbar = useSnackbar();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [cajaAbierta, setCajaAbierta] = useState(true);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);
  const [orderId, setOrderId] = useState(null);
  const [exchangeRate, setExchangeRate] = useState(36.8);
  const [actionBusy, setActionBusy] = useState(false);
  const [mobileTab, setMobileTab] = useState("products"); // "products" | "cart"

  const [saleModalOpen, setSaleModalOpen] = useState(false);
  const [saleModalLines, setSaleModalLines] = useState([]);
  const [saleBackendTotal, setSaleBackendTotal] = useState(null);
  const [saleOrderId, setSaleOrderId] = useState(null);
  const [saleProcessing, setSaleProcessing] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  const [opcionesModal, setOpcionesModal] = useState({ open: false, product: null });
  const [variantModal, setVariantModal] = useState({ open: false, product: null });
  const [inlineOpcionesProduct, setPosInlineOpcionesProduct] = useState(null);

  const orderIdRef = useRef(orderId);
  const syncChainRef = useRef(Promise.resolve());

  // Sincronizar orderId con la referencia para callbacks asíncronos
  useEffect(() => {
    orderIdRef.current = orderId;
  }, [orderId]);

  /**
   * Carga inicial del catálogo y estado de caja.
   */
  const loadCatalog = useCallback(async () => {
    setLoading(true);
    try {
      const [caja, catalog, tc] = await Promise.all([
        backofficeApi.cajaEstado().catch(() => ({ abierta: true })),
        fetchPosProductosYCategorias(backofficeApi, PAGINATION.POS_PRODUCTOS),
        backofficeApi.configuracionTipoCambio().catch(() => ({ valor: 36.8 })),
      ]);

      setExchangeRate(Number(tc?.tipoCambioDolar ?? tc?.TipoCambioDolar ?? tc?.valor ?? 36.8));
      setCajaAbierta(Boolean(caja?.abierta || caja?.estado === "Abierto"));
      setProducts(catalog.products);
      setCategories(catalog.categories);

      // Recuperar orden activa de sesión POS actual
      const activeOrder = await backofficeApi.getMesaOrdenActiva(POS_ORDER_VIRTUAL_ID).catch(() => null);
      const unwrapped = unwrapEnvelope(activeOrder);
      if (unwrapped) {
        setOrderId(getOrdenPedidoId(unwrapped, null));
        const items = getOrdenItems(unwrapped);
        if (items) setCart(mapBackendItemsToCart(items));
      }
    } catch (e) {
      snackbar.error(e.message || "Error cargando catálogo.");
    } finally {
      setLoading(false);
    }
  }, [snackbar]);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  /**
   * Productos filtrados para el catálogo.
   */
  const filteredProducts = useMemo(() => {
    return filterPosProducts(products, search, selectedCategory);
  }, [products, search, selectedCategory]);

  /**
   * Sincronización de items con el backend.
   */
  const syncOrderBackend = useCallback((product, cantidad = 1, opciones = [], notas = "", rollbackLineId = null) => {
    if (!cajaAbierta || actionBusy) return;

    syncChainRef.current = syncChainRef.current.then(async () => {
      const currentId = orderIdRef.current;
      const body = {
        Items: posCartToRetailItems([{ id: product.id, qty: cantidad, varianteId: product.varianteId }]),
      };

      try {
        const data = await backofficeApi.posOrdenes(body);
        const newId = extractPosOrdenResponseId(data, currentId);
        if (newId && newId !== orderIdRef.current) setOrderId(newId);
      } catch (e) {
        setCart((prev) => {
          const idx = prev.findIndex((x) => x.lineId === rollbackLineId);
          if (idx < 0) return prev;
          const next = [...prev];
          if (next[idx].qty <= cantidad) next.splice(idx, 1);
          else next[idx] = { ...next[idx], qty: next[idx].qty - cantidad };
          return next;
        });
        snackbar.error(e.message || "Error al sincronizar con el servidor.");
      }
    });
  }, [cajaAbierta, actionBusy, snackbar]);

  /**
   * Actualizar cantidad en el carrito.
   */
  const handleUpdateQty = useCallback((lineId, delta) => {
    setCart((prev) => {
      const idx = prev.findIndex((x) => x.lineId === lineId);
      if (idx < 0) return prev;
      const next = [...prev];
      const item = next[idx];
      const newQty = item.qty + delta;

      if (newQty <= 0) return prev; // Se maneja en el componente para remover

      next[idx] = { ...item, qty: newQty };
      syncOrderBackend({ id: item.id }, delta, [], "", lineId);
      return next;
    });
  }, [syncOrderBackend]);

  /**
   * Eliminar del carrito.
   */
  const handleRemoveFromCart = useCallback(async (lineId) => {
    const item = cart.find(x => x.lineId === lineId);
    if (!item) return;

    setCart(prev => prev.filter(x => x.lineId !== lineId));
    if (orderIdRef.current) {
      syncOrderBackend({ id: item.id }, -item.qty, [], "", lineId);
    }
  }, [cart, syncOrderBackend]);

  /**
   * Añadir producto al carrito.
   */
  const addToCart = useCallback((product) => {
    if (productoTieneOpcionesVisibles(product)) {
      if (getSingleGrupoOpcionesForPosInline(product)) {
        setPosInlineOpcionesProduct(product);
        return;
      }
      setOpcionesModal({ open: true, product });
      return;
    }

    const lineId = genPosLineId();
    setCart((prev) => {
      const idx = prev.findIndex((x) => x.id === product.id && !x.opcionesResumen);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
        syncOrderBackend(product, 1, [], "", next[idx].lineId);
        return next;
      }
      syncOrderBackend(product, 1, [], "", lineId);
      return [...prev, {
        lineId,
        id: product.id,
        name: product.nombre,
        price: product.precioVenta || product.precio || 0,
        qty: 1,
        opcionesSeleccionadas: [],
        opcionesResumen: "",
        notas: "",
        talla: product.talla,
        imagen: product.imagen
      }];
    });
  }, [syncOrderBackend]);

  /**
   * Añadir una variante específica al carrito.
   */
  const addVariantToCart = useCallback((product, variant) => {
    const lineId = genPosLineId();
    const finalPrice = (product.precioVenta || product.precio || 0) + (variant.precioAdicional || 0);
    
    setCart((prev) => {
      // Buscar si ya existe esta misma variante en el carrito
      const idx = prev.findIndex((x) => x.id === product.id && x.varianteId === variant.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
        syncOrderBackend(product, 1, [], "", next[idx].lineId);
        return next;
      }

      syncOrderBackend({ id: product.id, varianteId: variant.id }, 1, [], "", lineId);
      return [...prev, {
        lineId,
        id: product.id,
        varianteId: variant.id,
        name: product.nombre,
        price: finalPrice,
        qty: 1,
        opcionesSeleccionadas: [],
        opcionesResumen: `${variant.talla}${variant.color ? ` • ${variant.color}` : ""}`,
        notas: "",
        talla: variant.talla,
        color: variant.color,
        imagen: product.imagen
      }];
    });
    setVariantModal({ open: false, product: null });
  }, [syncOrderBackend]);

  /**
   * Preparar checkout.
   */
  const handleCheckout = useCallback(async () => {
    if (cart.length === 0) {
      snackbar.error("El carrito está vacío.");
      return;
    }
    try {
      setActionBusy(true);
      // En Retail no necesitamos fetch del servidor para el preview del cobro, usamos el carrito local
      const lines = posCartToModalLines(cart);
      
      setSaleModalLines(lines);
      setSaleBackendTotal(calculateSubtotal(cart));
      setSaleOrderId(orderId || orderIdRef.current || null); // ID opcional para registro
      setSaleModalOpen(true);
    } catch (e) {
      snackbar.error(e.message || "Error al preparar el cobro.");
    } finally {
      setActionBusy(false);
    }
  }, [cart, orderId, snackbar]);

  /**
   * Finalizar pago.
   */
  const onPaymentComplete = useCallback(async (paymentForm) => {
    setSaleProcessing(true);
    try {
      const isDolar = exchangeRate > 1 && Number(paymentForm.montoRecibidoDolares) > 0;
      const payload = {
        VentaId: Number(saleOrderId),
        TipoPago: paymentForm.tipoPago,
        MontoPagado: isDolar 
            ? Number(paymentForm.montoRecibidoDolares) 
            : Number(paymentForm.montoRecibidoCordobas || paymentForm.totalAPagarCordobas),
        Moneda: isDolar ? "Dolar" : "Cordoba",
        Observaciones: paymentForm.comentario || "Venta Retail",
        DescuentoMonto: paymentForm.descuento > 0 ? Number(paymentForm.descuento) : 0,
      };

      let resp;
      try {
        resp = await backofficeApi.ventasGestionarPago(payload);
      } catch {
        resp = await backofficeApi.ventasProcesarPago(payload);
      }

      const html = resp?.htmlImpresionRecibo || resp?.HtmlImpresionRecibo;
      if (html) await openBackendPrintHtml(html);

      snackbar.success("Venta finalizada con éxito.");

      setReceiptData({
        id: saleOrderId,
        items: [...cart],
        total: saleBackendTotal,
        pagadoConCordobas: paymentForm.tipoPago === "Efectivo" 
            ? Number(paymentForm.montoRecibidoCordobas) 
            : Number(paymentForm.totalAPagarCordobas),
        pagadoConDolares: paymentForm.tipoPago === "Efectivo" ? Number(paymentForm.montoRecibidoDolares) : 0,
        vuelto: paymentForm.tipoPago === "Efectivo" 
            ? (Number(paymentForm.montoRecibidoCordobas) + (Number(paymentForm.montoRecibidoDolares) * exchangeRate)) - saleBackendTotal 
            : 0,
        exchangeRate
      });

      setCart([]);
      setOrderId(null);
      setSaleModalOpen(false);
      setReceiptModalOpen(true);
      window.dispatchEvent(new CustomEvent("pos-inventory-updated"));
    } catch (e) {
      snackbar.error(e.message || "Error al registrar el pago.");
    } finally {
      setSaleProcessing(false);
    }
  }, [cart, saleOrderId, saleBackendTotal, exchangeRate, snackbar]);

  /**
   * Vaciar carrito.
   */
  const handleClearCart = useCallback(async () => {
    if (!orderId) {
      setCart([]);
      return;
    }
    try {
      setActionBusy(true);
      await backofficeApi.posCancelarOrden(orderId);
      setCart([]);
      setOrderId(null);
      snackbar.success("Carrito vaciado.");
    } catch (e) {
      snackbar.error("Error al vaciar orden en servidor.");
    } finally {
      setActionBusy(false);
    }
  }, [orderId, snackbar]);

  const subtotal = useMemo(() => calculateSubtotal(cart), [cart]);

  return {
    loading, products, categories, 
    selectedCategory, setSelectedCategory,
    search, setSearch,
    filteredProducts,
    cart, addToCart, handleUpdateQty, handleRemoveFromCart, handleClearCart,
    subtotal, 
    cajaAbierta, actionBusy,
    mobileTab, setMobileTab,
    handleCheckout,
    saleModalOpen, setSaleModalOpen, saleModalLines, saleBackendTotal, saleProcessing,
    onPaymentComplete,
    receiptModalOpen, setReceiptModalOpen, receiptData,
    exchangeRate,
    opcionesModal, setOpcionesModal,
    inlineOpcionesProduct, setPosInlineOpcionesProduct
  };
}
