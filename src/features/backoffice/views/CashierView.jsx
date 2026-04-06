import React from "react";
import { BackofficeListSkeletonLoading } from "../components/index.js";

// Hook Personalizado
import { useCashier } from "../hooks/useCashier.js";

// Componentes Modulares
import { CashierStatusCards } from "../components/cashier/CashierStatusCards.jsx";
import { CashierForms } from "../components/cashier/CashierForms.jsx";
import { CashierSummary } from "../components/cashier/CashierSummary.jsx";
import { CashierHistory } from "../components/cashier/CashierHistory.jsx";

/**
 * Vista principal de Caja (Refactorizada).
 * Ahora actúa como un orquestador que utiliza el hook useCashier 
 * y componentes especializados para cumplir con las reglas de Clean Code.
 */
export function CashierView({ currencySymbol = "C$" }) {
  const {
    estado,
    preview,
    historial,
    historialPage,
    historialTotalPages,
    cierreDetalle,
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
  } = useCashier();

  // Pantalla de carga inicial
  if (loading) return <BackofficeListSkeletonLoading rows={5} maxWidth="3xl" />;

  // Cálculos de resumen (Extraídos para claridad)
  const totalEfectivo = preview?.totales?.efectivo ?? preview?.efectivo ?? 0;
  const totalTarjeta = preview?.totales?.tarjeta ?? preview?.tarjeta ?? 0;
  const totalTransferencia = preview?.totales?.transferencia ?? preview?.transferencia ?? 0;
  const totalVentas = preview?.totales?.totalVentasNetas ?? preview?.totalGeneral ?? 0;
  const totalOrdenes = preview?.totales?.totalOrdenesPagadas ?? preview?.totalOrdenes ?? 0;
  const montoInicialActual = preview?.cierre?.montoInicial ?? estado?.caja?.montoInicial ?? 0;
  
  const montoEsperadoCalculado = 
    preview?.totales?.montoEsperado ?? 
    (Number(montoInicialActual || 0) + Number(totalEfectivo || 0));

  const cajaAbierta = estado?.abierta || estado?.estado === "Abierto";

  return (
    <div className="mx-auto min-w-0 max-w-3xl space-y-6">
      {/* Mensaje de Error Global */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 animate-in fade-in slide-in-from-top-2">
          {error}
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
        processing={processing}
        currencySymbol={currencySymbol}
      />
    </div>
  );
}
