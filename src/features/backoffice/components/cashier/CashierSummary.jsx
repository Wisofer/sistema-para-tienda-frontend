import React from "react";
import { formatCurrency } from "../../utils/currency.js";

/**
 * Resumen del día de la caja abierta.
 */
export function CashierSummary({
  totalVentas,
  totalOrdenes,
  totalEfectivo,
  totalTarjeta,
  totalTransferencia,
  montoEsperadoCalculado,
  currencySymbol
}) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm animate-in fade-in slide-in-from-bottom-3 duration-500">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Resumen de Operaciones</h3>
        <div className="flex -space-x-1">
          {[1, 2, 3].map((v) => (
            <div key={v} className="h-2 w-2 rounded-full bg-slate-100" />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Ventas Netas", value: totalVentas, color: "text-slate-900" },
          { label: "Órdenes", value: totalOrdenes, color: "text-slate-900", isCurrency: false },
          { label: "Efectivo", value: totalEfectivo, color: "text-emerald-600" },
          { label: "Tarjeta + Transf.", value: totalTarjeta + totalTransferencia, color: "text-blue-600" },
        ].map((item, i) => (
          <div key={i} className="rounded-2xl border border-slate-50 bg-slate-50/50 p-4 transition-all hover:bg-slate-50">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">{item.label}</p>
            <p className={`text-xl font-bold tracking-tight ${item.color}`}>
              {item.isCurrency === false ? item.value : formatCurrency(item.value, currencySymbol)}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col items-center justify-between gap-4 rounded-2xl bg-slate-900 p-6 text-white shadow-xl shadow-slate-200 sm:flex-row">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-slate-500">Monto Esperado en Caja (Efectivo)</p>
          <p className="text-4xl font-black tracking-tighter text-white">
            {formatCurrency(montoEsperadoCalculado, currencySymbol)}
          </p>
        </div>
        <div className="hidden h-12 w-px bg-slate-800 sm:block" />
        <div className="text-center sm:text-right">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Base Inicial</p>
          {/* Nota: En el diseño simplificado no pasamos el montoInicialActual, pero se puede inferir o pasar si es necesario */}
          <p className="text-sm font-bold text-slate-400">Calculado automátiamente</p>
        </div>
      </div>
    </article>
  );
}
