import React, { useMemo } from "react";
import { useOnlineStatus } from "../../../../hooks/useOnlineStatus.js";
import { offlineButtonTitle } from "../../../../constants/networkUi.js";
import { formatCurrency } from "../../utils/currency.js";
import { computeArqueoPreview } from "../../utils/cashierArqueo.js";
import { Coins, Lock, Unlock, CheckCircle, TrendingUp, AlertTriangle, ArrowLeft } from "lucide-react";

/**
 * Formularios de Apertura y Cierre de Caja.
 */
export function CashierForms({ 
  showApertura, 
  setShowApertura, 
  montoInicial, 
  setMontoInicial, 
  handleAperturaCaja,
  showCierreForm,
  cierreForm,
  setCierreForm,
  handleCerrarCaja,
  processing,
  currencySymbol,
  /** Monto esperado en efectivo (mismo criterio que el resumen / preview del API). */
  montoEsperadoEnCaja = 0,
}) {
  const isOnline = useOnlineStatus();

  const arqueoPreview = useMemo(
    () => computeArqueoPreview(cierreForm?.montoReal, montoEsperadoEnCaja),
    [cierreForm?.montoReal, montoEsperadoEnCaja]
  );

  // Formulario de Apertura (Inyectado en la pantalla de bienvenida)
  if (showApertura) {
    return (
      <article className="rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02),0_12px_24px_rgba(0,0,0,0.02)] animate-in slide-in-from-right-4 duration-500">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100/50 shadow-inner">
              <Coins className="h-5.5 w-5.5" />
            </span>
            <div>
              <h2 className="text-lg font-extrabold text-slate-800 tracking-tight">Apertura de Caja</h2>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">Registra el fondo inicial con el que inicias el turno.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowApertura(false)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-extrabold uppercase tracking-widest text-slate-600 hover:bg-slate-50 hover:text-slate-850 active:scale-95 transition-all duration-200 cursor-pointer"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
            Volver
          </button>
        </div>
        
        <form onSubmit={handleAperturaCaja} className="space-y-5">
          <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-6 flex flex-col items-center shadow-inner">
            <label className="mb-3.5 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
              Monto Inicial (Base de Efectivo)
            </label>
            <div className="flex items-center gap-2 focus-within:scale-105 transition-transform duration-300">
              <span className="text-3xl font-black text-indigo-500">{currencySymbol}</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={montoInicial}
                onChange={(e) => setMontoInicial(e.target.value)}
                placeholder="0.00"
                className="bg-transparent text-4xl font-black tabular-nums text-slate-800 placeholder:text-slate-250 focus:outline-none w-48 text-center"
                required
                autoFocus
              />
            </div>
          </div>
          
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider text-center leading-relaxed">
            Fondo de caja necesario para dar vuelto y cambio al iniciar la jornada.
          </p>
          
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="submit"
              disabled={processing || !isOnline}
              title={offlineButtonTitle(isOnline)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 py-3.5 text-xs font-extrabold uppercase tracking-widest text-white shadow-lg shadow-emerald-600/15 hover:scale-[1.01] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Unlock className="h-4.5 w-4.5" />
              Iniciar Operaciones
            </button>
            <button
              type="button"
              onClick={() => setShowApertura(false)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3.5 text-xs font-extrabold uppercase tracking-widest text-slate-650 hover:bg-slate-50 active:scale-[0.98] transition-all duration-300 cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </form>
      </article>
    );
  }

  // Formulario de Cierre (Inyectado bajo el resumen cuando la caja está abierta)
  if (showCierreForm) {
    return (
      <article className="rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02),0_12px_24px_rgba(0,0,0,0.02)] animate-in slide-in-from-bottom-2 duration-300">
        <h3 className="mb-4 text-xs font-extrabold uppercase tracking-wider text-slate-800">Cierre y arqueo de caja</h3>
        
        <form onSubmit={handleCerrarCaja} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200/80 bg-white focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 px-4 py-3 transition-all duration-300 shadow-sm">
              <label className="block text-[9px] font-extrabold uppercase tracking-widest text-slate-400">Efectivo contado (Real)</label>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-base font-black text-indigo-600">{currencySymbol}</span>
                <input
                  type="number"
                  step="0.01"
                  value={cierreForm.montoReal}
                  onChange={(e) => setCierreForm((s) => ({ ...s, montoReal: e.target.value }))}
                  placeholder="0.00"
                  className="w-full bg-transparent text-base font-black tabular-nums text-slate-800 focus:outline-none"
                  required
                />
              </div>
            </div>
            
            <div className="rounded-xl border border-slate-200/80 bg-white focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 px-4 py-3 transition-all duration-300 shadow-sm">
              <label className="block text-[9px] font-extrabold uppercase tracking-widest text-slate-400">Observaciones o notas</label>
              <input
                value={cierreForm.observaciones}
                onChange={(e) => setCierreForm((s) => ({ ...s, observaciones: e.target.value }))}
                placeholder="Opcional (ej: descuadre por vuelto)"
                className="w-full bg-transparent text-xs font-bold text-slate-700 mt-2 focus:outline-none placeholder:text-slate-300"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4.5 shadow-inner">
            <p className="text-xs font-extrabold text-slate-500 flex items-center gap-2">
              Monto esperado (según sistema):
              <span className="font-black text-slate-800 tabular-nums bg-white px-2 py-0.5 rounded border border-slate-100 text-sm shadow-sm">
                {formatCurrency(montoEsperadoEnCaja, currencySymbol)}
              </span>
            </p>
            
            {arqueoPreview === null ? (
              <p className="mt-3.5 text-xs text-slate-400 font-semibold">Ingresa un monto de efectivo válido para calcular el arqueo.</p>
            ) : arqueoPreview.kind === "empty" ? (
              <p className="mt-3.5 text-xs text-slate-400 font-semibold leading-relaxed">
                Al escribir el monto del efectivo contado físicamente en caja, el sistema calculará automáticamente si falta, sobra o si está completamente cuadrado.
              </p>
            ) : arqueoPreview.kind === "cuadra" ? (
              <div className="mt-3.5 flex items-start gap-3 rounded-xl border border-emerald-250 bg-emerald-50/60 p-4 animate-fade-in">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 shadow-inner">
                  <CheckCircle className="h-4.5 w-4.5 stroke-[2]" />
                </span>
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-950">{arqueoPreview.label}</p>
                  <p className="mt-0.5 text-xs font-semibold text-emerald-850 leading-relaxed">{arqueoPreview.detail}</p>
                </div>
              </div>
            ) : arqueoPreview.kind === "sobra" ? (
              <div className="mt-3.5 flex items-start gap-3 rounded-xl border border-green-250 bg-green-50/60 p-4 shadow-sm animate-fade-in">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-800 shadow-inner">
                  <TrendingUp className="h-4.5 w-4.5 stroke-[2]" />
                </span>
                <div className="flex-1">
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-green-950">{arqueoPreview.label}</p>
                  <p className="mt-0.5 text-2xl font-black tabular-nums text-green-600">
                    +{formatCurrency(arqueoPreview.diff, currencySymbol)}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-green-800/90 leading-relaxed">{arqueoPreview.detail}</p>
                </div>
              </div>
            ) : (
              <div className="mt-3.5 flex items-start gap-3 rounded-xl border border-rose-250 bg-rose-50/60 p-4 shadow-sm animate-fade-in">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-800 shadow-inner animate-pulse">
                  <AlertTriangle className="h-4.5 w-4.5 stroke-[2]" />
                </span>
                <div className="flex-1">
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-rose-950">{arqueoPreview.label}</p>
                  <p className="mt-0.5 text-2xl font-black tabular-nums text-rose-600">
                    {formatCurrency(arqueoPreview.diff, currencySymbol)}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-rose-800/90 leading-relaxed">{arqueoPreview.detail}</p>
                </div>
              </div>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={processing || !isOnline}
              title={offlineButtonTitle(isOnline)}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-750 hover:from-rose-700 hover:to-red-800 py-3.5 text-xs font-extrabold uppercase tracking-widest text-white shadow-lg shadow-rose-600/10 hover:scale-[1.01] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto cursor-pointer"
            >
              <Lock className="h-4 w-4" />
              Finalizar Turno y Cerrar
            </button>
          </div>
        </form>
      </article>
    );
  }

  return null;
}

