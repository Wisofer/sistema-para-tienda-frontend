import { useState, useEffect, useCallback } from "react";
import { backofficeApi } from "../services/backofficeApi.js";
import { PAGINATION } from "../constants/pagination.js";
import { useSnackbar } from "../../../contexts/SnackbarContext.jsx";

/**
 * Hook personalizado para manejar la lógica del módulo de Caja.
 * Extraído de CashierView para cumplir con Clean Code.
 */
export function useCashier() {
  const snackbar = useSnackbar();
  const [estado, setEstado] = useState(null);
  const [preview, setPreview] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [historialPage, setHistorialPage] = useState(1);
  const [historialTotalPages, setHistorialTotalPages] = useState(1);
  const [cierreDetalle, setCierreDetalle] = useState(null);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showApertura, setShowApertura] = useState(false);
  const [showHistorial, setShowHistorial] = useState(false);
  const [showCierreForm, setShowCierreForm] = useState(false);
  const [montoInicial, setMontoInicial] = useState("");
  const [cierreForm, setCierreForm] = useState({ montoReal: "", observaciones: "" });

  const loadAll = useCallback(async (page = historialPage) => {
    setError("");
    try {
      const [e, prev, hist] = await Promise.all([
        backofficeApi.cajaEstado(),
        backofficeApi.cajaCierrePreview().catch(() => null),
        backofficeApi.cajaHistorial({ page, pageSize: PAGINATION.LIST_DEFAULT }).catch(() => ({ items: [], totalPages: 1, page: 1 })),
      ]);
      setEstado(e || null);
      setPreview(prev || null);
      const rawItems = hist?.items ?? hist?.Items;
      setHistorial(Array.isArray(rawItems) ? rawItems : Array.isArray(hist) ? hist : []);
      setHistorialPage(hist?.page ?? hist?.Page ?? page);
      setHistorialTotalPages(hist?.totalPages ?? hist?.TotalPages ?? 1);
      
      const abierta = e?.abierta || e?.estado === "Abierto";
      if (abierta && showApertura) setShowApertura(false);
    } catch (e) {
      setError(e.message || "Error al cargar datos de caja.");
    }
  }, [historialPage, showApertura]);

  useEffect(() => {
    let mounted = true;
    loadAll(1)
      .catch((e) => {
        if (!mounted) return;
        setError(e.message || "No se pudo cargar caja.");
      })
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  const handleAperturaCaja = async (e) => {
    if (e) e.preventDefault();
    const monto = Number(montoInicial);
    if (!Number.isFinite(monto) || monto <= 0) {
      snackbar.error("El monto inicial debe ser mayor a 0.");
      return;
    }
    setProcessing(true);
    setError("");
    try {
      await backofficeApi.cajaApertura(monto);
      snackbar.success("Caja abierta correctamente.");
      setMontoInicial("");
      setShowApertura(false);
      await loadAll(1);
    } catch (err) {
      snackbar.error(err.message || "No se pudo abrir la caja.");
    } finally {
      setProcessing(false);
    }
  };

  const handleCerrarCaja = async (e) => {
    if (e) e.preventDefault();
    setProcessing(true);
    setError("");
    try {
      await backofficeApi.cajaCierre({
        montoReal: Number(cierreForm.montoReal || 0),
        observaciones: cierreForm.observaciones || undefined,
      });
      snackbar.success("Caja cerrada correctamente.");
      setCierreForm({ montoReal: "", observaciones: "" });
      setShowCierreForm(false);
      await loadAll(1);
    } catch (err) {
      snackbar.error(err.message || "No se pudo cerrar la caja.");
    } finally {
      setProcessing(false);
    }
  };

  const loadDetalleCierre = async (id) => {
    setProcessing(true);
    setError("");
    try {
      const data = await backofficeApi.cajaDetalleCierre(id);
      setCierreDetalle(data || null);
    } catch (err) {
      setError(err.message || "No se pudo cargar el detalle del cierre.");
    } finally {
      setProcessing(false);
    }
  };

  return {
    estado, preview, historial, historialPage, historialTotalPages,
    cierreDetalle, error, processing, loading,
    showApertura, setShowApertura,
    showHistorial, setShowHistorial,
    showCierreForm, setShowCierreForm,
    montoInicial, setMontoInicial,
    cierreForm, setCierreForm,
    loadAll, handleAperturaCaja, handleCerrarCaja, loadDetalleCierre
  };
}
