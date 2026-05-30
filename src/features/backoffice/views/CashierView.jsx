import React from "react";
import { BackofficeListSkeletonLoading, BackofficePageShell } from "../components/index.js";

// Hook Personalizado
import { useCashier } from "../hooks/useCashier.js";

// Componentes Modulares
import { CashierStatusCards } from "../components/cashier/CashierStatusCards.jsx";
import { CashierForms } from "../components/cashier/CashierForms.jsx";
import { CashierSummary } from "../components/cashier/CashierSummary.jsx";
import { CashierHistory } from "../components/cashier/CashierHistory.jsx";
import {
  cajaPreviewMediosPago,
  cajaPreviewMontoEsperado,
  cajaPreviewMontoInicial,
  cajaPreviewTotalVentas,
} from "../utils/caja.js";

/**
 * Vista principal de Caja (Refactorizada).
 * Ahora actúa como un orquestador que utiliza el hook useCashier 
 * y componentes especializados para cumplir con las reglas de Clean Code.
 */
export function CashierView({ currencySymbol = "C$" }) {
  const {
    estado,
    preview,
    ticketsCobrados,
    historial,
    historialPage,
    historialTotalPages,
    cierreDetalle,
    clearCierreDetalle,
    error,
    processing,
    loading,
    showApertura,
    setShowApertura,
    showHistorial,
    setShowHistorial,
    showCierreForm,
    setShowCierreForm,
    montoInicial,
    setMontoInicial,
    cierreForm,
    setCierreForm,
    loadAll,
    handleAperturaCaja,
    handleCerrarCaja,
    loadDetalleCierre
  } = useCashier(currencySymbol);

  // Pantalla de carga inicial
  if (loading) return <BackofficeListSkeletonLoading rows={5} maxWidth="7xl" />;

  const { efectivo: totalEfectivo, tarjeta: totalTarjeta, transferencia: totalTransferencia } =
    cajaPreviewMediosPago(preview);
  const totalVentas = cajaPreviewTotalVentas(preview);
  const totalOrdenes = ticketsCobrados;
  const montoInicialActual = cajaPreviewMontoInicial(preview, estado);
  const montoEsperadoCalculado = cajaPreviewMontoEsperado(preview, montoInicialActual);

  const cajaAbierta = estado?.abierta || estado?.estado === "Abierto";

  return (
    <BackofficePageShell maxWidth="7xl" className="space-y-6">
      {/* Mensaje de Error Global */}
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-4 text-xs font-extrabold uppercase tracking-wider text-rose-800 animate-in fade-in duration-300 shadow-sm shadow-rose-100/10">
          ⚠️ {error}
        </div>
      )}


      {/* 1. Estado y Bienvenida */}
      <CashierStatusCards 
        cajaAbierta={cajaAbierta}
        showApertura={showApertura}
        setShowApertura={setShowApertura}
        showCierreForm={showCierreForm}
        setShowCierreForm={setShowCierreForm}
      />

      {/* 2. Formularios (Apertura / Cierre) */}
      <CashierForms 
        showApertura={showApertura}
        setShowApertura={setShowApertura}
        montoInicial={montoInicial}
        setMontoInicial={setMontoInicial}
        handleAperturaCaja={handleAperturaCaja}
        showCierreForm={showCierreForm}
        cierreForm={cierreForm}
        setCierreForm={setCierreForm}
        handleCerrarCaja={handleCerrarCaja}
        processing={processing}
        currencySymbol={currencySymbol}
        montoEsperadoEnCaja={montoEsperadoCalculado}
      />

      {/* 3. Panel de Operaciones (Solo si está abierta) */}
      {cajaAbierta && (
        <CashierSummary 
          totalVentas={totalVentas}
          totalOrdenes={totalOrdenes}
          totalEfectivo={totalEfectivo}
          totalTarjeta={totalTarjeta}
          totalTransferencia={totalTransferencia}
          montoEsperadoCalculado={montoEsperadoCalculado}
          montoInicialActual={montoInicialActual}
          currencySymbol={currencySymbol}
        />
      )}

      {/* 4. Historial y Análisis */}
      <CashierHistory 
        showHistorial={showHistorial}
        setShowHistorial={setShowHistorial}
        historial={historial}
        historialPage={historialPage}
        historialTotalPages={historialTotalPages}
        loadAll={loadAll}
        loadDetalleCierre={loadDetalleCierre}
        cierreDetalle={cierreDetalle}
        clearCierreDetalle={clearCierreDetalle}
        processing={processing}
        currencySymbol={currencySymbol}
      />
    </BackofficePageShell>
  );
}
