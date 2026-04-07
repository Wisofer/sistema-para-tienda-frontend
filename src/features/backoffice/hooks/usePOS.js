import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { backofficeApi } from "../services/backofficeApi.js";
import { useSnackbar } from "../../../contexts/SnackbarContext.jsx";
import { PAGINATION } from "../constants/pagination.js";
import { POS_INVENTORY_UPDATED_EVENT } from "../constants/posEvents.js";
import {
  extractPosOrdenResponseId,
  extractVentaIdFromPayment,
  getOrdenItems,
  mapBackendItemsToCart,
  posCartToModalLines,
  mergeDuplicateCartLines,
  posCartToRetailItems,
  posLineEsProductoSimpleSinOpciones,
  unwrapEnvelope,
} from "../utils/posPedido.js";
import { PAYMENT_METHOD_API } from "../../../utils/paymentMethod.js";
import { fetchPosProductosYCategorias } from "../utils/posCatalogLoad.js";
import { printPosTicketAfterPayment } from "../utils/backofficePrint.js";
import {
  genPosLineId,
  productoTieneOpcionesVisibles,
  getSingleGrupoOpcionesForPosInline,
} from "../utils/productoOpciones.js";
import { labelVarianteResumen, normalizeProductoVariantes, productoRequiereModalVariante } from "../utils/posVariantes.js";
import { POS_ORDER_VIRTUAL_ID, calculateSubtotal, filterPosProducts } from "../utils/posUtils.js";
import { useOnlineStatus } from "../../../hooks/useOnlineStatus.js";
import { NETWORK_UI } from "../../../constants/networkUi.js";

/**
 * Hook personalizado para manejar la lógica del Punto de Venta (POS).
 */
export function usePOS(currencySymbol = "C$") {
  const snackbar = useSnackbar();
  const isOnline = useOnlineStatus();

  const [loading, setLoading] = useState(true);
  const [cajaAbierta, setCajaAbierta] = useState(true);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);
  const [exchangeRate, setExchangeRate] = useState(36.8);
  const [actionBusy, setActionBusy] = useState(false);
  const [mobileTab, setMobileTab] = useState("products"); // "products" | "cart"

  const [saleModalOpen, setSaleModalOpen] = useState(false);
  const [saleModalLines, setSaleModalLines] = useState([]);
  const [saleBackendTotal, setSaleBackendTotal] = useState(null);
  const [saleProcessing, setSaleProcessing] = useState(false);

  const [opcionesModal, setOpcionesModal] = useState({ open: false, product: null });
  const [variantModal, setVariantModal] = useState({ open: false, product: null });
  const [inlineOpcionesProduct, setPosInlineOpcionesProduct] = useState(null);

  /** Evita doble envío de cobro (doble clic / submit rápido antes de que `busy` repinte). */
  const paymentInFlightRef = useRef(false);

  const applyPosCatalogData = useCallback((catalog) => {
    setProducts(catalog.products);
    setCategories(catalog.categories);
  }, []);

  /**
   * Carga inicial: caja, tipo de cambio, catálogo y orden POS activa (si existe).
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
      applyPosCatalogData(catalog);

      const activeOrder = await backofficeApi.getMesaOrdenActiva(POS_ORDER_VIRTUAL_ID).catch(() => null);
      const unwrapped = unwrapEnvelope(activeOrder);
      if (unwrapped) {
        const items = getOrdenItems(unwrapped);
        if (items) setCart(mapBackendItemsToCart(items));
      }
    } catch (e) {
      snackbar.error(e.message || "Error cargando catálogo.");
    } finally {
      setLoading(false);
    }
  }, [snackbar, applyPosCatalogData]);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  /** Solo catálogo (stock/precios), sin pantalla de carga — tras venta o `POS_INVENTORY_UPDATED_EVENT`. */
  const refreshCatalogProducts = useCallback(async () => {
    try {
      const catalog = await fetchPosProductosYCategorias(backofficeApi, PAGINATION.POS_PRODUCTOS);
      applyPosCatalogData(catalog);
    } catch (e) {
      snackbar.error(e.message || "No se pudo actualizar el catálogo.");
    }
  }, [snackbar, applyPosCatalogData]);

  useEffect(() => {
    const onInventoryUpdated = () => {
      void refreshCatalogProducts();
    };
    window.addEventListener(POS_INVENTORY_UPDATED_EVENT, onInventoryUpdated);
    return () => window.removeEventListener(POS_INVENTORY_UPDATED_EVENT, onInventoryUpdated);
  }, [refreshCatalogProducts]);

  /**
   * Productos filtrados para el catálogo.
   */
  const filteredProducts = useMemo(() => {
    return filterPosProducts(products, search, selectedCategory);
  }, [products, search, selectedCategory]);

  /**
   * Actualizar cantidad en el carrito.
   */
  const handleUpdateQty = useCallback(
    (lineId, delta) => {
      setCart((prev) => {
        const idx = prev.findIndex((x) => x.lineId === lineId);
        if (idx < 0) return prev;
        const next = [...prev];
        const item = next[idx];
        const base = Math.max(1, Math.floor(Number(item.qty) || 1));
        const newQty = base + delta;

        if (newQty <= 0) return prev;

        next[idx] = { ...item, qty: newQty };
        return next;
      });
    },
    []
  );

  /**
   * Eliminar del carrito.
   */
  const handleRemoveFromCart = useCallback((lineId) => {
    setCart((prev) => prev.filter((x) => x.lineId !== lineId));
  }, []);

  /**
   * Línea con variante (talla/SKU) — envía `ProductoVarianteId` cuando aplica (stock con variantes).
   */
  const addVariantToCart = useCallback(
    (product, variant) => {
      if (!product || !variant) return;
      const vid = Number(variant.id);
      if (!Number.isFinite(vid) || vid <= 0) return;
      const stockV = Number(variant.stock ?? 0);
      if (product.controlarStock && stockV <= 0) {
        snackbar.error("Sin stock disponible para esta variante.");
        return;
      }
      const finalPrice = (product.precioVenta || product.precio || 0) + (variant.precioAdicional || 0);
      const resumen = labelVarianteResumen(variant);
      const lineId = genPosLineId();
      setVariantModal({ open: false, product: null });

      setCart((prev) => {
        const idx = prev.findIndex((x) => x.id === product.id && x.varianteId === vid);
        if (idx >= 0) {
          const next = [...prev];
          const prevQty = Math.max(1, Math.floor(Number(next[idx].qty) || 1));
          const merged = { ...next[idx], qty: prevQty + 1 };
          if (product.controlarStock && merged.qty > stockV) {
            setTimeout(() => snackbar.error("No hay stock suficiente para esta variante."), 0);
            return prev;
          }
          next[idx] = merged;
          return next;
        }
        if (product.controlarStock && stockV < 1) {
          setTimeout(() => snackbar.error("No hay stock suficiente para esta variante."), 0);
          return prev;
        }
        const newLine = {
          lineId,
          id: product.id,
          varianteId: vid,
          name: product.nombre,
          price: finalPrice,
          qty: 1,
          opcionesSeleccionadas: [],
          opcionesResumen: resumen,
          notas: "",
          talla: variant.talla,
          imagen: product.imagen,
        };
        const next = [...prev, newLine];
        return next;
      });
    },
    [snackbar]
  );

  /**
   * Añadir producto al carrito.
   * Backend: si hay más de una variante y controla stock, debe elegirse talla; si solo hay una, basta productoId (igual enviamos variante explícita).
   */
  const addToCart = useCallback(
    (product) => {
      const vars = normalizeProductoVariantes(product);
      if (productoRequiereModalVariante(product)) {
        setVariantModal({ open: true, product });
        return;
      }
      if (vars.length === 1) {
        addVariantToCart(product, vars[0]);
        return;
      }
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
        const idx = prev.findIndex(
          (x) => x.id === product.id && posLineEsProductoSimpleSinOpciones(x)
        );
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
          return next;
        }
        const newLine = {
          lineId,
          id: product.id,
          name: product.nombre,
          price: product.precioVenta || product.precio || 0,
          qty: 1,
          opcionesSeleccionadas: [],
          opcionesResumen: "",
          notas: "",
          talla: product.talla,
          imagen: product.imagen,
        };
        const next = [...prev, newLine];
        return next;
      });
    },
    [addVariantToCart]
  );

  /**
   * Preparar checkout.
   */
  const handleCheckout = useCallback(async () => {
    if (!isOnline) {
      snackbar.error(NETWORK_UI.snackbarCobrar);
      return;
    }
    if (cart.length === 0) {
      snackbar.error("El carrito está vacío.");
      return;
    }
    try {
      setActionBusy(true);
      const mergedCart = mergeDuplicateCartLines(cart);
      if (mergedCart.length !== cart.length) {
        setCart(mergedCart);
      }
      /**
       * Importante: en el backend actual, POST /api/v1/pos/ventas registra la venta y descuenta stock
       * de inmediato; no es un “borrador” que se pueda ir sincronizando en cada clic. Por eso no llamamos
       * a pos/ventas al armar el carrito — solo al cobrar (en `onPaymentComplete`).
       */
      const lines = posCartToModalLines(mergedCart);

      setSaleModalLines(lines);
      setSaleBackendTotal(calculateSubtotal(mergedCart));
      setSaleModalOpen(true);
    } catch (e) {
      snackbar.error(e.message || "Error al preparar el cobro.");
    } finally {
      setActionBusy(false);
    }
  }, [cart, snackbar, isOnline]);

  /**
   * Finalizar pago.
   */
  const onPaymentComplete = useCallback(
    async (paymentForm) => {
      if (!isOnline) {
        snackbar.error(NETWORK_UI.snackbarCompletarCobro);
        return;
      }
      if (paymentInFlightRef.current) return;
      paymentInFlightRef.current = true;
      setSaleProcessing(true);
      try {
        const mergedCart = mergeDuplicateCartLines(cart);
        if (mergedCart.length === 0) {
          snackbar.error("El carrito está vacío.");
          return;
        }

        const clienteIdVenta = Number(paymentForm?.clienteId);
        const tieneCliente = Number.isFinite(clienteIdVenta) && clienteIdVenta > 0;

        let ordenResp;
        try {
          const ordenBody = {
            Items: posCartToRetailItems(mergedCart),
          };
          /** Muchos backends asocian el cliente al crear la venta (POST /pos/ventas), no solo al cobrar. */
          if (tieneCliente) {
            ordenBody.ClienteId = clienteIdVenta;
          }
          ordenResp = await backofficeApi.posOrdenes(ordenBody);
        } catch (e) {
          snackbar.error(e.message || "No se pudo registrar la venta.");
          return;
        }

        const ordenData = unwrapEnvelope(ordenResp) ?? ordenResp;
        const ventaIdRaw = extractPosOrdenResponseId(ordenData, null);
        const vid = Number(ventaIdRaw);
        if (!Number.isFinite(vid) || vid <= 0) {
          snackbar.error("No se obtuvo el identificador de venta.");
          return;
        }

        const monedaApi = paymentForm.moneda === "USD" ? PAYMENT_METHOD_API.DOLARES : PAYMENT_METHOD_API.CORDOBAS;
        const montoPagado =
          paymentForm.moneda === "USD"
            ? Number(paymentForm.montoRecibido ?? 0)
            : Number(paymentForm.montoRecibidoCordobas ?? paymentForm.totalAPagarCordobas ?? 0);

        const payload = {
          VentaId: vid,
          TipoPago: paymentForm.tipoPago,
          MontoPagado: montoPagado,
          Moneda: monedaApi,
          Observaciones: paymentForm.comentario || "Venta Retail",
          DescuentoMonto: paymentForm.descuento > 0 ? Number(paymentForm.descuento) : 0,
        };
        if (tieneCliente) {
          payload.ClienteId = clienteIdVenta;
        }

        let resp;
        try {
          resp = await backofficeApi.ventasGestionarPago(payload);
        } catch {
          resp = await backofficeApi.ventasProcesarPago(payload);
        }

        const html = resp?.htmlImpresionRecibo || resp?.HtmlImpresionRecibo;
        const ventaIdResuelto = extractVentaIdFromPayment(resp) ?? vid;

        try {
          await printPosTicketAfterPayment({
            html,
            ventaId: ventaIdResuelto,
            fetchTicketPdf: (id) => backofficeApi.ventasTicketPdf(id),
          });
        } catch (e) {
          snackbar.error(e.message || "No se pudo imprimir el ticket.");
        }

        snackbar.success("Venta finalizada con éxito.");

        setCart([]);
        setSaleModalOpen(false);
        window.dispatchEvent(new CustomEvent(POS_INVENTORY_UPDATED_EVENT));
      } catch (e) {
        snackbar.error(e.message || "Error al registrar el pago.");
      } finally {
        setSaleProcessing(false);
        paymentInFlightRef.current = false;
      }
    },
    [cart, snackbar, isOnline]
  );

  /**
   * Vaciar carrito.
   */
  const handleClearCart = useCallback(() => {
    setCart([]);
  }, []);

  const subtotal = useMemo(() => calculateSubtotal(cart), [cart]);

  return {
    loading,
    categories,
    selectedCategory,
    setSelectedCategory,
    search,
    setSearch,
    filteredProducts,
    cart,
    addToCart,
    handleUpdateQty,
    handleRemoveFromCart,
    handleClearCart,
    subtotal,
    cajaAbierta,
    actionBusy,
    isOnline,
    mobileTab,
    setMobileTab,
    handleCheckout,
    saleModalOpen,
    setSaleModalOpen,
    saleModalLines,
    saleBackendTotal,
    saleProcessing,
    onPaymentComplete,
    exchangeRate,
    opcionesModal,
    setOpcionesModal,
    variantModal,
    setVariantModal,
    addVariantToCart,
    inlineOpcionesProduct,
    setPosInlineOpcionesProduct,
  };
}
