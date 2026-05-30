import React from "react";
import { X, Wallet, CreditCard, Send, User, MessageSquare } from "lucide-react";
import { formatCurrency } from "../../utils/currency.js";
import {
  cierreDetalleDiferencia,
  cierreDetalleFechaDisplay,
  cierreDetalleMediosPago,
  cierreDetalleMontoEsperado,
  cierreDetalleMontoInicial,
  cierreDetalleMontoRealNullable,
  cierreDetalleTexto,
  cierreDetalleTotalGeneral,
  diffAmountTextClass,
} from "../../utils/caja.js";

/**
 * Contenido del detalle de un cierre (apertura, ventas, arqueo, medios de pago).
 */
export function CierreDetallePanel({ detalle, currencySymbol = "C$", onClose }) {
  const diffVal = cierreDetalleDiferencia(detalle);
  const diffColor = diffAmountTextClass(diffVal);
  const { efectivo: efectivoDet, tarjeta: tarjetaDet, transferencia: transferDet } =
    cierreDetalleMediosPago(detalle);
  const usuarioTxt = cierreDetalleTexto(detalle, ["usuario", "Usuario"]);
  const observacionesTxt = cierreDetalleTexto(detalle, ["observaciones", "Observaciones"]);

  const summaryCards = [
    {
      label: "Apertura (Fondo)",
      value: cierreDetalleMontoInicial(detalle),
      color: "text-slate-800",
      bg: "bg-slate-50/50",
      border: "border-slate-100",
      optional: false,
    },
    {
      label: "Ventas Totales",
      value: cierreDetalleTotalGeneral(detalle),
      color: "text-blue-600",
      bg: "bg-blue-50/30",
      border: "border-blue-100/50",
      optional: false,
    },
    {
      label: "Esperado Efectivo",
      value: cierreDetalleMontoEsperado(detalle),
      color: "text-slate-800",
      bg: "bg-slate-50/50",
      border: "border-slate-100",
      optional: false,
    },
    {
      label: "Contado (Real)",
      value: cierreDetalleMontoRealNullable(detalle),
      color: "text-emerald-700",
      bg: "bg-emerald-50/20",
      border: "border-emerald-100/55",
      optional: true,
    },
    {
      label: "Diferencia Arqueo",
      value: diffVal,
      color: diffColor,
      bg: "bg-amber-50/30",
      border: "border-amber-100/55",
      optional: true,
    },
  ];

  return (
    <>
      <div className="mb-5 flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <span className="rounded bg-slate-100 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-slate-500">
            Reporte de Caja
          </span>
          <h2 className="text-base font-extrabold text-slate-80 tracking-tight mt-1.5">
            Detalle del Cierre #{detalle.id ?? detalle.Id ?? "—"}
          </h2>
          <p className="mt-0.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {cierreDetalleFechaDisplay(detalle)}
          </p>
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 active:scale-95 transition-all cursor-pointer shadow-sm"
          >
            <X className="h-4.5 w-4.5" aria-hidden />
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {summaryCards.map((d, i) => (
          <div key={i} className={`rounded-2xl border p-4.5 hover:shadow-md hover:shadow-slate-100/20 transition-all duration-300 ${d.bg} ${d.border}`}>
            <p className="text-[9px] font-extrabold uppercase tracking-widest text-slate-450">{d.label}</p>
            <p className={`mt-2 text-xl font-black tabular-nums tracking-tight ${d.color}`}>
              {d.optional && (d.value == null || !Number.isFinite(Number(d.value)))
                ? "—"
                : formatCurrency(d.value ?? 0, currencySymbol)}
            </p>
          </div>
        ))}
      </div>

      <h4 className="mt-6 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Medios de pago registrados</h4>
      <div className="mt-3.5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-4.5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400">Efectivo Ventas</p>
            <p className="mt-1.5 text-base font-black tabular-nums text-slate-800 tracking-tight">
              {efectivoDet != null ? formatCurrency(efectivoDet, currencySymbol) : "—"}
            </p>
          </div>
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 text-slate-600 border border-slate-100">
            <Wallet className="h-4 w-4" />
          </span>
        </div>
        
        <div className="rounded-2xl border border-slate-100 bg-white p-4.5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400">Tarjeta</p>
            <p className="mt-1.5 text-base font-black tabular-nums text-slate-800 tracking-tight">
              {tarjetaDet != null ? formatCurrency(tarjetaDet, currencySymbol) : "—"}
            </p>
          </div>
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 text-slate-600 border border-slate-100">
            <CreditCard className="h-4 w-4" />
          </span>
        </div>
        
        <div className="rounded-2xl border border-slate-100 bg-white p-4.5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400">Transferencia</p>
            <p className="mt-1.5 text-base font-black tabular-nums text-slate-800 tracking-tight">
              {transferDet != null ? formatCurrency(transferDet, currencySymbol) : "—"}
            </p>
          </div>
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 text-slate-600 border border-slate-100">
            <Send className="h-4 w-4" />
          </span>
        </div>
      </div>

      {(observacionesTxt || usuarioTxt) && (
        <div className="mt-5 space-y-2.5 rounded-2xl border border-slate-100 bg-slate-50/50 p-5 text-xs shadow-inner">
          {usuarioTxt ? (
            <div className="flex items-start gap-2">
              <User className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
              <p className="font-semibold text-slate-650">
                Registrado por:{" "}
                <span className="font-extrabold text-slate-800">{usuarioTxt}</span>
              </p>
            </div>
          ) : null}
          {observacionesTxt ? (
            <div className="flex items-start gap-2 border-t border-slate-150/40 pt-2.5">
              <MessageSquare className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
              <p className="font-semibold text-slate-650 leading-relaxed">
                Observaciones:{" "}
                <span className="font-bold text-slate-700">{observacionesTxt}</span>
              </p>
            </div>
          ) : null}
        </div>
      )}
    </>
  );
}

