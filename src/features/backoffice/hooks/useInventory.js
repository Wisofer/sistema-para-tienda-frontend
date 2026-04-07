import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { backofficeApi } from "../services/backofficeApi.js";
import { PAGINATION } from "../constants/pagination.js";
import { POS_INVENTORY_UPDATED_EVENT } from "../constants/posEvents.js";
import { resolveProductCodigoForSave } from "../utils/productCodigo.js";
import { parseOpcionesEspecialesFromGruposApi } from "../utils/productoOpcionesEspecialesSync.js";
import { downloadCSV } from "../utils/exportUtils.js";
import { useSnackbar } from "../../../contexts/SnackbarContext.jsx";
import { PROVIDERS_UPDATED_EVENT } from "../providers/constants.js";
import { tieneControlStock, normalizeMovementRow } from "../utils/inventoryUtils.js";

/** 
 * Hook personalizado para manejar toda la lógica del módulo de Inventario.
 * @param {string} currencySymbol - Símbolo de moneda para reportes/exportación.
 */
export function useInventory(currencySymbol = "C$") {
  const snackbar = useSnackbar();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [providers, setProviders] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  
  // Configuración de visualización
  const [gridColumns, setGridColumns] = useState(() => {
    const saved = localStorage.getItem("inv_grid_cols");
    return saved ? Number(saved) : 5;
  });

  useEffect(() => {
    localStorage.setItem("inv_grid_cols", gridColumns);
  }, [gridColumns]);
  
  // Modales
  const [modalOpen, setModalOpen] = useState(false);
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [stockMode, setStockMode] = useState("entrada");
  const [movementModalOpen, setMovementModalOpen] = useState(false);
  const [productHistoryModalOpen, setProductHistoryModalOpen] = useState(false);
  const [categoriesScreen, setCategoriesScreen] = useState(false);
  const [confirmAction, setConfirmAction] = useState({ open: false, type: "", id: null, name: "" });

  // Datos para modales
  const [movementRows, setMovementRows] = useState([]);
  const [movementProductLookup, setMovementProductLookup] = useState([]);
  const [historyRows, setHistoryRows] = useState([]);
  const [selectedProductName, setSelectedProductName] = useState("");
  const [stockModalProducts, setStockModalProducts] = useState([]);
  const [stockProductQuery, setStockProductQuery] = useState("");
  const [stockModalLoading, setStockModalLoading] = useState(false);
  const [stockSuggestOpen, setStockSuggestOpen] = useState(false);
  const stockSuggestBlurTimerRef = useRef(null);

  // Formularios
  const [form, setForm] = useState({
    id: null,
    codigo: "",
    nombre: "",
    descripcion: "",
    precioVenta: "",
    precioCompra: "",
    categoriaProductoId: "",
    proveedorId: "",
    stock: "",
    stockMinimo: "",
    controlarStock: true,
    activo: true,
    opcionesEspecialesOn: false,
    opcionesEspecialesLines: [""],
    opcionesEspecialesGrupoId: null,
    talla: "",
    imagen: "",
  });

  const [stockForm, setStockForm] = useState({
    productoId: "",
    productoVarianteId: "",
    cantidad: "",
    costoUnitario: "",
    proveedorId: "",
    numeroFactura: "",
    subtipo: "Daño",
    cantidadNueva: "",
    observaciones: "",
  });

  const loadProducts = useCallback(async (categoriaId = selectedCategory) => {
    try {
      const data = await backofficeApi.listProductos({
        page: 1,
        pageSize: PAGINATION.PRODUCTOS_ADMIN,
        search: search || undefined,
        categoriaId: categoriaId || undefined,
      });
      setProducts(Array.isArray(data?.items) ? data.items : []);
    } catch (e) {
      setError(e.message || "Error al cargar productos.");
    }
  }, [selectedCategory, search]);

  // Carga inicial
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    Promise.all([
      loadProducts(""),
      backofficeApi.catalogoCategoriasProducto(),
      backofficeApi.catalogoProveedores()
    ])
      .then(([, cat, prov]) => {
        if (!mounted) return;
        setCategories(Array.isArray(cat) ? cat : cat?.items || []);
        setProviders(Array.isArray(prov) ? prov : prov?.items || []);
      })
      .catch((e) => mounted && setError(e.message || "No se pudo cargar la información inicial."))
      .finally(() => mounted && setLoading(false));
    
    return () => { mounted = false; };
  }, []); // Solo al montar

  // Escuchar actualizaciones de proveedores
  useEffect(() => {
    const onProvidersUpdated = async () => {
      try {
        const prov = await backofficeApi.catalogoProveedores();
        setProviders(Array.isArray(prov) ? prov : prov?.items || []);
      } catch { /* Fail silently */ }
    };
    window.addEventListener(PROVIDERS_UPDATED_EVENT, onProvidersUpdated);
    return () => window.removeEventListener(PROVIDERS_UPDATED_EVENT, onProvidersUpdated);
  }, []);

  const reloadCategoriesOnly = useCallback(async () => {
    try {
      const cat = await backofficeApi.catalogoCategoriasProducto();
      setCategories(Array.isArray(cat) ? cat : cat?.items || []);
    } catch (e) {
      snackbar.error(e.message || "No se pudo actualizar categorías.");
    }
  }, [snackbar]);

  const filteredProducts = useMemo(() => {
    const withCategoryName = (p) => {
      if (p.categoriaNombre) return p;
      const cid = p.categoriaProductoId;
      const cat = categories.find((c) => String(c.id) === String(cid));
      return {
        ...p,
        categoriaNombre: cat?.nombre || cat?.Nombre || "",
      };
    };
    let list = products.map(withCategoryName);
    if (selectedCategory) {
      list = list.filter((p) => String(p.categoriaProductoId || "") === String(selectedCategory));
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter((p) =>
        (p.nombre || "").toLowerCase().includes(q) ||
        (p.codigo || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [products, categories, selectedCategory, search]);

  const onCategoryChange = async (value) => {
    setSelectedCategory(value);
    setLoading(true);
    try {
      await loadProducts(value);
    } finally {
      setLoading(false);
    }
  };

  const removeProduct = async (id) => {
    setSaving(true);
    try {
      await backofficeApi.deleteProducto(id);
      await loadProducts(selectedCategory);
      snackbar.success("Producto eliminado/desactivado.");
      window.dispatchEvent(new CustomEvent(POS_INVENTORY_UPDATED_EVENT));
    } catch (e) {
      snackbar.error(e.message || "No se pudo eliminar el producto.");
    } finally {
      setSaving(false);
    }
  };

  const exportProductsExcel = async () => {
    setSaving(true);
    try {
      const headers = [
        { label: "Código", key: "codigo" },
        { label: "Nombre", key: "nombre" },
        { label: "Talla", key: "talla" },
        { label: "Color", key: "color" },
        { label: "Stock", key: "stock" },
        { label: "Precio", key: "precioVenta" },
      ];
      const filename = `inventario-${new Date().toISOString().slice(0, 10)}.csv`;
      downloadCSV(filteredProducts, headers, filename);
      snackbar.success("Inventario exportado correctamente.");
    } catch (e) {
      snackbar.error("Error al exportar inventario.");
    } finally {
      setSaving(false);
    }
  };

  // Lógica de Modales de Formulario
  const peerCodigos = useCallback((excludeProductId) => 
    products
      .filter((p) => !excludeProductId || String(p.id) !== String(excludeProductId))
      .map((p) => p.codigo),
    [products]
  );

  const openCreate = () => {
    setForm({
      id: null,
      codigo: "",
      nombre: "",
      descripcion: "",
      precioVenta: "",
      precioCompra: "",
      categoriaProductoId:
        selectedCategory !== "" && selectedCategory != null
          ? String(selectedCategory)
          : categories[0]?.id != null
            ? String(categories[0].id)
            : "",
      proveedorId: providers[0]?.id != null ? String(providers[0].id) : "",
      stock: "",
      stockMinimo: "",
      controlarStock: true,
      activo: true,
      opcionesEspecialesOn: false,
      opcionesEspecialesLines: [""],
      opcionesEspecialesGrupoId: null,
      talla: "",
      color: "",
      imagen: "",
    });
    setModalOpen(true);
  };

  const openEdit = async (id) => {
    setSaving(true);
    try {
      const [p, gruposRaw] = await Promise.all([
        backofficeApi.getProducto(id),
        backofficeApi.listProductoOpcionesGrupos(id).catch(() => null),
      ]);
      const parsed = parseOpcionesEspecialesFromGruposApi(gruposRaw ?? []);
      const lineas = parsed.lineas.length ? parsed.lineas : [""];
      const tieneOpciones = lineas.some((s) => String(s || "").trim());
      
      const catId = p.categoriaProductoId ?? p.CategoriaProductoId;
      const provId = p.proveedorId ?? p.ProveedorId;
      setForm({
        id: p.id,
        codigo: p.codigo || "",
        nombre: p.nombre || "",
        descripcion: p.descripcion || p.Descripcion || "",
        precioVenta:
          p.precioVenta ?? p.PrecioVenta ?? p.precio ?? p.Precio ?? "",
        precioCompra: p.precioCompra ?? p.PrecioCompra ?? "",
        categoriaProductoId: catId != null && catId !== "" ? String(catId) : "",
        proveedorId: provId != null && provId !== "" ? String(provId) : "",
        stock: p.stock ?? "",
        stockMinimo: p.stockMinimo ?? "",
        controlarStock: Boolean(p.controlarStock),
        activo: p.activo !== false,
        opcionesEspecialesOn: tieneOpciones,
        opcionesEspecialesLines: lineas,
        opcionesEspecialesGrupoId: parsed.grupoId,
        talla: p.talla || "",
        color: p.color || "",
        imagen: p.imagen || "",
      });
      setModalOpen(true);
    } catch (e) {
      snackbar.error(e.message || "No se pudo cargar el producto.");
    } finally {
      setSaving(false);
    }
  };

  const saveProduct = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const codigo = resolveProductCodigoForSave(form.codigo, form.nombre, peerCodigos(form.id));
      const ctrl = Boolean(form.controlarStock);
      const body = {
        codigo,
        nombre: form.nombre,
        descripcion: form.descripcion,
        precio: Number(form.precioVenta || 0),
        precioVenta: Number(form.precioVenta || 0),
        precioCompra: Number(form.precioCompra || 0),
        categoriaProductoId: Number(form.categoriaProductoId),
        ...(form.proveedorId ? { proveedorId: Number(form.proveedorId) } : {}),
        stockMinimo: ctrl ? Number(form.stockMinimo || 0) : 0,
        controlarStock: ctrl,
        activo: Boolean(form.activo),
        talla: form.talla,
        color: form.color,
        imagen: form.imagen,
        stock: ctrl ? Number(form.stock ?? 0) : 0,
      };
      
      if (form.id) {
        await backofficeApi.updateProducto(form.id, body);
      } else {
        // El stock inicial va en el POST (FormData StockActual). Evita un segundo POST que suele 404 si la ruta de movimientos no coincide.
        await backofficeApi.createProducto(body);
      }
      
      await loadProducts(selectedCategory);
      setModalOpen(false);
      snackbar.success(form.id ? "Producto actualizado." : "Producto creado.");
      window.dispatchEvent(new CustomEvent(POS_INVENTORY_UPDATED_EVENT));
    } catch (e2) {
      snackbar.error(e2.message || "No se pudo guardar el producto.");
    } finally {
      setSaving(false);
    }
  };

  // Lógica de Movimientos de Stock
  const openStockModal = async (mode) => {
    setStockMode(mode);
    setStockProductQuery("");
    setStockSuggestOpen(false);
    setStockForm({
      productoId: "",
      productoVarianteId: "",
      cantidad: "",
      costoUnitario: "",
      proveedorId: providers[0]?.id != null ? String(providers[0].id) : "",
      numeroFactura: "",
      subtipo: "Daño",
      cantidadNueva: "",
      observaciones: "",
    });
    setStockModalOpen(true);
    setStockModalLoading(true);
    try {
      const data = await backofficeApi.listProductos({ page: 1, pageSize: PAGINATION.CATALOG_ALERTS, activos: true });
      const items = Array.isArray(data?.items) ? data.items : [];
      setStockModalProducts(items.filter(tieneControlStock));
    } catch {
      setStockModalProducts(products.filter(tieneControlStock));
    } finally {
      setStockModalLoading(false);
    }
  };

  const submitStockAction = async (e) => {
    if (e) e.preventDefault();
    if (!stockForm.productoId) {
      snackbar.error("Selecciona un producto.");
      return;
    }
    
    const vars =
      selectedStockProduct?.variantes ??
      selectedStockProduct?.Variantes ??
      [];
    const variantList = Array.isArray(vars) ? vars : [];
    if (variantList.length > 1 && !String(stockForm.productoVarianteId || "").trim()) {
      snackbar.error("Este producto tiene varias variantes: elige talla/color.");
      return;
    }

    const varianteOpt =
      stockForm.productoVarianteId && String(stockForm.productoVarianteId).trim() !== ""
        ? Number(stockForm.productoVarianteId)
        : undefined;

    setSaving(true);
    try {
      const varianteBody =
        varianteOpt != null && Number.isFinite(varianteOpt) && varianteOpt > 0
          ? { productoVarianteId: varianteOpt }
          : {};

      if (stockMode === "entrada") {
        await backofficeApi.entradaStockProducto({
          productoId: Number(stockForm.productoId),
          ...varianteBody,
          cantidad: Number(stockForm.cantidad),
          costoUnitario: Number(stockForm.costoUnitario || 0),
          proveedorId: stockForm.proveedorId ? Number(stockForm.proveedorId) : null,
          numeroReferencia: stockForm.numeroFactura?.trim() || null,
          observaciones: stockForm.observaciones || null,
        });
      } else if (stockMode === "salida") {
        await backofficeApi.salidaStockProducto({
          productoId: Number(stockForm.productoId),
          ...varianteBody,
          cantidad: Number(stockForm.cantidad),
          subtipo: stockForm.subtipo,
          observaciones: stockForm.observaciones || null,
        });
      } else {
        await backofficeApi.ajusteStockProducto({
          productoId: Number(stockForm.productoId),
          ...varianteBody,
          stockFisicoReal: Number(stockForm.cantidadNueva),
          observaciones: stockForm.observaciones || null,
        });
      }
      
      await loadProducts(selectedCategory);
      setStockModalOpen(false);
      snackbar.success("Movimiento de inventario aplicado.");
      window.dispatchEvent(new CustomEvent(POS_INVENTORY_UPDATED_EVENT));
    } catch (e2) {
      snackbar.error(e2.message || "No se pudo aplicar el movimiento.");
    } finally {
      setSaving(false);
    }
  };

  // Historial y Movimientos Globales
  const openGlobalMovements = async () => {
    setSaving(true);
    try {
      const [movRes, prodRes] = await Promise.all([
        backofficeApi.movimientosProductos({ page: 1, pageSize: PAGINATION.MOVIMIENTOS }),
        backofficeApi.listProductos({ page: 1, pageSize: PAGINATION.CATALOG_ALERTS, activos: true }).catch(() => ({ items: [] })),
      ]);
      const rawMov = movRes?.items ?? movRes?.Items ?? movRes?.movimientos ?? (Array.isArray(movRes) ? movRes : []);
      setMovementRows(Array.isArray(rawMov) ? rawMov.map(normalizeMovementRow) : []);
      setMovementProductLookup(Array.isArray(prodRes?.items) ? prodRes.items : []);
      setMovementModalOpen(true);
    } catch (e) {
      snackbar.error(e.message || "No se pudo cargar movimientos.");
    } finally {
      setSaving(false);
    }
  };

  const exportMovimientosInventarioExcel = useCallback(async () => {
    setSaving(true);
    try {
      await backofficeApi.exportarMovimientosInventarioExcel({});
      snackbar.success("Excel descargado.");
    } catch (e) {
      snackbar.error(e.message || "No se pudo exportar.");
    } finally {
      setSaving(false);
    }
  }, [snackbar]);

  const openProductHistory = async (p) => {
    setSaving(true);
    try {
      const data = await backofficeApi.movimientosProducto(p.id, { limite: 50 });
      const rows = data?.movimientos ?? data?.items ?? data?.Items ?? [];
      setHistoryRows(Array.isArray(rows) ? rows.map(normalizeMovementRow) : []);
      setSelectedProductName(p.nombre || "Producto");
      setProductHistoryModalOpen(true);
    } catch (e) {
      snackbar.error(e.message || "No se pudo cargar historial.");
    } finally {
      setSaving(false);
    }
  };

  const selectedStockProduct = useMemo(() => {
    const raw = stockModalProducts.length > 0 ? stockModalProducts : products;
    const list = raw.filter(tieneControlStock);
    return list.find((p) => String(p.id) === String(stockForm.productoId));
  }, [stockModalProducts, products, stockForm.productoId]);

  const stockAutocompleteList = useMemo(() => {
    const raw = stockModalProducts.length > 0 ? stockModalProducts : products;
    const list = raw.filter(tieneControlStock);
    const q = stockProductQuery.trim().toLowerCase();
    if (!q) return [];
    return list
      .filter((p) => {
        const hay = `${p.nombre || ""} ${p.codigo || ""} ${p.categoriaNombre || p.categoria || ""}`.toLowerCase();
        return hay.includes(q);
      })
      .slice(0, 10);
  }, [stockModalProducts, products, stockProductQuery]);

  return {
    products, categories, providers, loading, saving, error,
    search, setSearch, selectedCategory, onCategoryChange,
    filteredProducts, removeProduct, exportProductsExcel, reloadCategoriesOnly,
    modalOpen, setModalOpen, openCreate, openEdit, saveProduct, form, setForm,
    stockModalOpen, setStockModalOpen, openStockModal, submitStockAction, stockForm, setStockForm, stockMode,
    stockModalProducts, stockProductQuery, setStockProductQuery, stockModalLoading, stockSuggestOpen, setStockSuggestOpen, stockSuggestBlurTimerRef,
    selectedStockProduct, stockAutocompleteList,
    movementModalOpen, setMovementModalOpen, openGlobalMovements, exportMovimientosInventarioExcel,
    movementRows, movementProductLookup,
    productHistoryModalOpen, setProductHistoryModalOpen, openProductHistory, historyRows, selectedProductName,
    categoriesScreen, setCategoriesScreen,
    confirmAction, setConfirmAction,
    gridColumns, setGridColumns
  };
}
