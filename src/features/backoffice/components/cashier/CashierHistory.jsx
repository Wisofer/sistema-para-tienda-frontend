import React from "react";
import { formatCurrency } from "../../utils/currency.js";
import {
  cierreDetalleDiferencia,
  cierreDetalleMontoEsperado,
  cierreDetalleMontoReal,
  cierreFechaRaw,
  cierreHistorialMontoPrincipal,
  cierreId,
} from "../../utils/caja.js";

/**
 * Historial de cierres de caja con detalle modal incrustado.
 */
export function CashierHistory({
  showHistorial,
  setShowHistorial,
  historial,
  historialPage,
  historialTotalPages,
  loadAll,
  loadDetalleCierre,
  cierreDetalle,
  processing,
  currencySymbol
}) {
  return (
    <>
      <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm animate-in fade-in slide-in-from-bottom-5 duration-700">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <span className="font-bold">H</span>
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Historial de Cierres</h3>
              <p className="text-xs font-medium text-slate-400">Consulta los arqueos de turnos pasados.</p>
            </div>
          </div>
          <button
            onClick={() => setShowHistorial(!showHistorial)}
            className="rounded-xl border border-slate-200 px-5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all"
          >
            {showHistorial ? "Ocultar" : "Vistas Históricas"}
          </button>
        </div>

        {showHistorial && (
          <div className="mt-8 space-y-6">
            {/* Paginación */}
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-2">
              <button
                onClick={() => loadAll(Math.max(1, historialPage - 1))}
                disabled={historialPage <= 1 || processing}
                className="h-9 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 shadow-sm disabled:opacity-50 hover:bg-slate-50"
              >
                ← Anterior
              </button>
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                Turno {historialPage} de {historialTotalPages}
              </span>
              <button
                onClick={() => loadAll(Math.min(historialTotalPages, historialPage + 1))}
                disabled={historialPage >= historialTotalPages || processing}
                className="h-9 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 shadow-sm disabled:opacity-50 hover:bg-slate-50"
              >
                Siguiente →
              </button>
            </div>

            {/* Listado */}
            {historial.length === 0 ? (
              <p className="py-8 text-center text-xs font-black uppercase tracking-widest text-slate-300">Sin cierres registrados aún.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {historial.map((item, i) => {
                  const cid = cierreId(item) ?? i + 1;
                  return (
                    <div key={cid} className="flex items-center justify-between py-4 transition-all hover:px-2 hover:bg-slate-50/50 rounded-xl">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-px bg-slate-100" />
                        <div>
                          <p className="text-sm font-black text-slate-900 tracking-tight">Cierre de Caja #{cid}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">{String(cierreFechaRaw(item)).slice(0, 16).replace('T', ' ')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-lg font-black text-slate-900 tracking-tighter">
                          {formatCurrency(cierreHistorialMontoPrincipal(item), currencySymbol)}
                        </span>
                        <button
                          type="button"
                          onClick={() => loadDetalleCierre(cierreId(item))}
                          disabled={cierreId(item) == null || processing}
                          className="rounded-xl bg-slate-900 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-slate-200 hover:bg-black disabled:opacity-50 transition-all active:scale-[0.98]"
                        >
                          Ver Detalle
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </article>

      {/* Detalle Modal (Incrustado) */}
      {cierreDetalle && (
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl animate-in fade-in zoom-in duration-500 ring-4 ring-slate-50 ring-offset-4">
          <h2 className="mb-6 text-base font-black uppercase tracking-widest text-slate-900">Análisis del Cierre</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              { label: "Monto Esperado", value: cierreDetalleMontoEsperado(cierreDetalle), color: "text-slate-900", bg: "bg-slate-50" },
              { label: "Monto Real", value: cierreDetalleMontoReal(cierreDetalle), color: "text-blue-600", bg: "bg-blue-50/30" },
              { label: "Diferencia", value: cierreDetalleDiferencia(cierreDetalle), color: "text-red-600", bg: "bg-red-50/30" },
            ].map((d, i) => (
              <div key={i} className={`rounded-2xl p-4 ${d.bg} border-l-4 ${d.color.replace('text-', 'border-')}`}>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">{d.label}</p>
                <p className={`text-2xl font-black tracking-tight ${d.color}`}>
                  {formatCurrency(d.value, currencySymbol)}
                </p>
              </div>
            ))}
          </div>
        </article>
      )}
    </>
  );
}
