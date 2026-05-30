import React from "react";
import { Lock, Unlock, ShieldAlert } from "lucide-react";

/**
 * Tarjetas de estado superior para el módulo de Caja.
 */
export function CashierStatusCards({ 
  cajaAbierta, 
  showApertura, 
  setShowApertura, 
  showCierreForm, 
  setShowCierreForm 
}) {
  // Estado: Caja Cerrada (Pantalla de bienvenida)
  if (!cajaAbierta && !showApertura) {
    return (
      <article className="rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-[0_4px_20px_rgba(0,0,0,0.02),0_12px_24px_rgba(0,0,0,0.02)] transition-all duration-300">
        <div className="mx-auto mb-4 inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50/50 px-3.5 py-1 text-[10px] font-extrabold uppercase tracking-widest text-blue-700 shadow-inner">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
          Estado actual
        </div>
        
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 shadow-inner hover:scale-105 transition-transform duration-300">
          <Lock className="h-7.5 w-7.5 stroke-[1.8]" />
        </div>
        
        <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Caja Cerrada</h2>
        
        <p className="mx-auto mt-2 max-w-sm text-xs text-slate-500 font-medium leading-relaxed">
          La caja está lista para iniciar. Abre la caja registradora para comenzar las operaciones del día y habilitar los cobros de ventas.
        </p>
        
        <div className="mx-auto mt-6 h-px w-16 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
        
        <button
          onClick={() => setShowApertura(true)}
          type="button"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-6 py-3 text-xs font-extrabold uppercase tracking-widest text-white shadow-lg shadow-blue-600/15 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 cursor-pointer"
        >
          <Unlock className="h-4 w-4" />
          Abrir Caja
        </button>
      </article>
    );
  }

  // Estado: Caja Abierta (Banner informativo)
  if (cajaAbierta) {
    return (
      <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.01),0_8px_16px_rgba(0,0,0,0.01)] transition-all duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100/50 shadow-inner">
              <Unlock className="h-5.5 w-5.5 animate-bounce-slow" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-800 tracking-tight">Caja Abierta</h2>
                <span className="rounded-md bg-blue-50 border border-blue-100/40 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest text-blue-600">
                  Activa
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Operando correctamente para la jornada del día de hoy.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowCierreForm(!showCierreForm)}
            className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-extrabold uppercase tracking-widest shadow-md transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
              showCierreForm 
                ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 shadow-slate-100/10" 
                : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/10"
            }`}
          >
            {showCierreForm ? (
              <>Ocultar Cierre</>
            ) : (
              <>
                <Lock className="h-3.5 w-3.5" />
                Cerrar Caja
              </>
            )}
          </button>
        </div>
      </article>
    );
  }

  return null;
}

