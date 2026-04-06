import React from "react";
import { SlidersHorizontal } from "lucide-react";
import { BackofficeDialog } from "../../components/index.js";
import { formatMovementDate, movementProductLabel } from "../../utils/inventoryUtils.js";

/**
 * Modal para visualizar todos los movimientos del inventario global.
 */
export function GlobalMovementsModal({
  open,
  onClose,
  movementRows,
  movementProductLookup,
}) {
  if (!open) return null;

  return (
    <BackofficeDialog MAX_WIDTH="max-w-4xl" onBackdropClick={onClose}>
      <div className="flex w-full flex-col">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-800 tracking-tight uppercase">
            Movimientos de Inventario
          </h3>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-slate-100 transition-colors"
          >
            <SlidersHorizontal className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        <div className="mt-4 max-h-[70vh] overflow-auto rounded-2xl border border-slate-100 ring-4 ring-slate-50">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-slate-900 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <tr>
                <th className="px-4 py-4">Fecha</th>
                <th className="px-4 py-4">Tipo</th>
                <th className="px-4 py-4">Producto</th>
                <th className="px-4 py-4 text-right">Cantidad</th>
                <th className="px-4 py-4">Sub-tipo / Motivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {movementRows.map((m, idx) => {
                const isEntrada = m.tipo === "Entrada";
                const isSalida = m.tipo === "Salida";
                return (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="whitespace-nowrap px-4 py-3 text-[11px] font-bold text-slate-500 uppercase">
                      {formatMovementDate(m)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-tighter ${
                          isEntrada
                            ? "bg-green-100 text-green-700"
                            : isSalida
                            ? "bg-red-100 text-red-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {m.tipo}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-800 uppercase tracking-tight">
                      {movementProductLabel(m, movementProductLookup)}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-black ${
                        isEntrada ? "text-green-600" : isSalida ? "text-red-600" : "text-blue-600"
                      }`}
                    >
                      {isEntrada ? "+" : ""}
                      {m.cantidad}
                    </td>
                    <td className="px-4 py-3 text-[11px] font-medium text-slate-500 uppercase tracking-tight">
                      {m.subtipo || m.observaciones || "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </BackofficeDialog>
  );
}

/**
 * Modal para visualizar el historial específico de un producto.
 */
export function ProductHistoryModal({
  open,
  onClose,
  historyRows,
  selectedProductName,
}) {
  if (!open) return null;

  return (
    <BackofficeDialog onBackdropClick={onClose}>
      <div className="flex w-full flex-col">
        <h3 className="text-lg font-bold text-slate-800 tracking-tight uppercase">
          Historial de Stock
        </h3>
        <p className="text-xs font-black text-blue-600 uppercase tracking-widest">
          {selectedProductName}
        </p>

        <div className="mt-4 max-h-80 overflow-auto rounded-xl border border-slate-100 ring-4 ring-slate-50">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-slate-900 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3 text-right">Cant.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {historyRows.map((m, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                    {formatMovementDate(m)}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`text-[10px] font-black uppercase ${
                        m.tipo === "Entrada"
                          ? "text-green-600"
                          : m.tipo === "Salida"
                          ? "text-red-600"
                          : "text-blue-600"
                      }`}
                    >
                      {m.tipo}
                    </span>
                  </td>
                  <td
                    className={`px-4 py-2 text-right font-black ${
                      m.tipo === "Entrada"
                        ? "text-green-600"
                        : m.tipo === "Salida"
                        ? "text-red-600"
                        : "text-blue-600"
                    }`}
                  >
                    {m.tipo === "Entrada" ? "+" : ""}
                    {m.cantidad}
                  </td>
                </tr>
              ))}
              {historyRows.length === 0 && (
                <tr>
                  <td
                    colSpan="3"
                    className="py-8 text-center text-xs text-slate-400 font-bold uppercase tracking-widest"
                  >
                    No hay movimientos registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <button
          onClick={onClose}
          className="mt-6 rounded-xl bg-slate-900 py-3 text-sm font-bold text-white shadow-xl hover:bg-slate-800 transition-all active:scale-[0.98]"
        >
          Cerrar Historial
        </button>
      </div>
    </BackofficeDialog>
  );
}
