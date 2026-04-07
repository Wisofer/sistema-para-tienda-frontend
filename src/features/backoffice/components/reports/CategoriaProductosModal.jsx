import React from "react";
import { X } from "lucide-react";
import { formatCurrency } from "../../utils/currency.js";

/**
 * Detalle de productos vendidos dentro de una categoría (reporte por categoría).
 */
export function CategoriaProductosModal({ open, onClose, categoriaRow, currencySymbol = "C$" }) {
  if (!open) return null;

  const cat = categoriaRow || {};
  const productos = Array.isArray(cat.productos) ? cat.productos : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <article className="max-h-[85vh] w-full max-w-2xl overflow-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h4 className="text-lg font-bold text-slate-800 uppercase tracking-tight">Productos de la categoría</h4>
            <p className="mt-1 text-sm font-semibold text-slate-700">{cat.categoria || "—"}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-300 text-slate-700 transition-colors hover:bg-slate-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 text-sm sm:grid-cols-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Unidades</p>
            <p className="font-bold text-slate-900">{cat.cantidad ?? "—"}</p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total categoría</p>
            <p className="font-bold text-blue-600">{formatCurrency(cat.monto ?? 0, currencySymbol)}</p>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Productos</p>
            <p className="font-bold text-slate-900">{productos.length}</p>
          </div>
        </div>

        {productos.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">No hay productos en esta categoría para el período.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-3 py-2">Producto</th>
                  <th className="px-3 py-2">Código</th>
                  <th className="px-3 py-2 text-center">Unidades</th>
                  <th className="px-3 py-2 text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {productos.map((p, i) => (
                  <tr key={p.productoId != null ? `p-${p.productoId}` : i} className="hover:bg-slate-50/50">
                    <td className="px-3 py-2 font-medium text-slate-800">{p.productoNombre ?? "—"}</td>
                    <td className="px-3 py-2 text-xs text-slate-600">{p.codigoProducto || "—"}</td>
                    <td className="px-3 py-2 text-center text-slate-700">{p.cantidad ?? "—"}</td>
                    <td className="px-3 py-2 text-right font-semibold text-slate-900">
                      {formatCurrency(p.monto ?? 0, currencySymbol)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </div>
  );
}
