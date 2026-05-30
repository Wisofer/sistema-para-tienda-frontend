import React from "react";
import { History, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { BackofficeDialog } from "../index.js";
import { formatCurrency } from "../../utils/currency.js";
import { cierreFechaRaw, cierreHistorialMontoPrincipal, cierreId } from "../../utils/caja.js";
import { CierreDetallePanel } from "./CierreDetallePanel.jsx";

/**
 * Historial de cierres de caja; el detalle se abre en modal centrado.
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
  clearCierreDetalle,
  processing,
  currencySymbol,
}) {
  return (
    <>
      <article className="rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02),0_12px_24px_rgba(0,0,0,0.02)] transition-all duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100/50 shadow-inner">
              <History className="h-5.5 w-5.5 stroke-[1.8]" aria-hidden />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">Historial de Cierres</h3>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">Consulta de arqueos y turnos finalizados.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowHistorial(!showHistorial)}
            className="inline-flex items-center justify-center rounded-xl border border-slate-205 bg-white px-5 py-2.5 text-xs font-extrabold uppercase tracking-widest text-slate-600 hover:bg-blue-50/50 hover:text-blue-600 hover:border-blue-200 active:scale-95 transition-all duration-200 cursor-pointer shadow-sm"
          >
            {showHistorial ? "Ocultar Historial" : "Mostrar Historial"}
          </button>
        </div>

        {showHistorial && (
          <div className="mt-6 space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/50 p-2 shadow-inner">
              <button
                type="button"
                onClick={() => loadAll(Math.max(1, historialPage - 1))}
                disabled={historialPage <= 1 || processing}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-650 disabled:opacity-40 hover:bg-blue-50/50 hover:text-blue-600 hover:border-blue-200 active:scale-95 transition-all cursor-pointer shadow-sm"
              >
                <ChevronLeft className="h-4.5 w-4.5" />
              </button>
              
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                Página {historialPage} de {historialTotalPages}
              </span>
              
              <button
                type="button"
                onClick={() => loadAll(Math.min(historialTotalPages, historialPage + 1))}
                disabled={historialPage >= historialTotalPages || processing}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-650 disabled:opacity-40 hover:bg-blue-50/50 hover:text-blue-600 hover:border-blue-200 active:scale-95 transition-all cursor-pointer shadow-sm"
              >
                <ChevronRight className="h-4.5 w-4.5" />
              </button>
            </div>

            {historial.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 py-10 text-center">
                <p className="text-sm font-semibold text-slate-400">No hay cierres de caja registrados en el historial.</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-50 rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-sm">
                {historial.map((item, i) => {
                  const cid = cierreId(item) ?? i + 1;
                  return (
                    <li
                      key={cid}
                      className="flex items-center justify-between gap-4 px-4 py-3.5 hover:bg-slate-50/50 transition-all duration-200"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Turno / Cierre #{cid}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-0.5 tracking-tight">
                          {String(cierreFechaRaw(item)).slice(0, 16).replace("T", " ")}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-black tabular-nums text-slate-800 tracking-tight">
                          {formatCurrency(cierreHistorialMontoPrincipal(item), currencySymbol)}
                        </span>
                        <button
                          type="button"
                          onClick={() => loadDetalleCierre(cierreId(item))}
                          disabled={cierreId(item) == null || processing}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-extrabold uppercase tracking-widest text-white hover:bg-blue-700 active:scale-95 transition-all cursor-pointer disabled:opacity-50 shadow-sm shadow-blue-100"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Detalle
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </article>

      <BackofficeDialog
        open={Boolean(cierreDetalle)}
        onClose={() => clearCierreDetalle?.()}
        maxWidthClass="max-w-2xl"
      >
        {cierreDetalle ? (
          <CierreDetallePanel
            detalle={cierreDetalle}
            currencySymbol={currencySymbol}
            onClose={() => clearCierreDetalle?.()}
          />
        ) : null}
      </BackofficeDialog>
    </>
  );
}

