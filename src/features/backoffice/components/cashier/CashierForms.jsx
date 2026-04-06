import React from "react";

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
  currencySymbol 
}) {
  // Formulario de Apertura (Inyectado en la pantalla de bienvenida)
  if (showApertura) {
    return (
      <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm animate-in slide-in-from-right-4 duration-500">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Apertura de Caja</h2>
            <p className="text-sm font-medium text-slate-500">Registra el monto inicial de la jornada.</p>
          </div>
          <button
            onClick={() => setShowApertura(false)}
            className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-200"
          >
            Volver
          </button>
        </div>
        <form onSubmit={handleAperturaCaja} className="space-y-4">
          <div className="rounded-xl bg-slate-50 p-4">
            <label className="mb-2 block text-sm font-black uppercase tracking-widest text-slate-400">Monto inicial ({currencySymbol})</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={montoInicial}
              onChange={(e) => setMontoInicial(e.target.value)}
              placeholder="0.00"
              className="w-full bg-transparent text-2xl font-black text-slate-900 placeholder:text-slate-300 focus:outline-none"
              required
              autoFocus
            />
          </div>
          <p className="text-xs font-medium text-slate-400">Este monto representa el efectivo base (fondo de caja) con el que inicias ventas.</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="submit"
              disabled={processing}
              className="rounded-xl bg-green-600 py-3 text-sm font-bold text-white shadow-lg shadow-green-100 hover:bg-green-700 disabled:opacity-50 transition-all active:scale-[0.98]"
            >
              Iniciar Operaciones
            </button>
            <button
              type="button"
              onClick={() => setShowApertura(false)}
              className="rounded-xl bg-slate-800 py-3 text-sm font-bold text-white hover:bg-slate-900 transition-all active:scale-[0.98]"
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
      <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm animate-in slide-in-from-bottom-2 duration-300">
        <h3 className="mb-4 text-sm font-black uppercase tracking-widest text-slate-400">Formulario de Arqueo</h3>
        <form onSubmit={handleCerrarCaja} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 px-4 py-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Efectivo Real</label>
            <input
              type="number"
              step="0.01"
              value={cierreForm.montoReal}
              onChange={(e) => setCierreForm((s) => ({ ...s, montoReal: e.target.value }))}
              placeholder="Contado"
              className="w-full bg-transparent text-lg font-bold text-slate-900 focus:outline-none"
              required
            />
          </div>
          <div className="rounded-xl border border-slate-200 px-4 py-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Observaciones</label>
            <input
              value={cierreForm.observaciones}
              onChange={(e) => setCierreForm((s) => ({ ...s, observaciones: e.target.value }))}
              placeholder="Opcional"
              className="w-full bg-transparent text-sm font-medium text-slate-900 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={processing}
            className="rounded-xl bg-red-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-red-100 hover:bg-red-700 disabled:opacity-50 transition-all active:scale-[0.98]"
          >
            Finalizar Turno
          </button>
        </form>
      </article>
    );
  }

  return null;
}
