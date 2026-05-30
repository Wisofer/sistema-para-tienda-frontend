import React from "react";
import { formatCurrency } from "../../utils/currency.js";
import { TrendingUp, Ticket, Coins, CreditCard } from "lucide-react";

/**
 * Resumen del día cuando la caja está abierta (legible, estilo operativo retail).
 */
export function CashierSummary({
  totalVentas,
  totalOrdenes,
  totalEfectivo,
  totalTarjeta,
  totalTransferencia,
  montoEsperadoCalculado,
  montoInicialActual,
  currencySymbol,
}) {
  const efectivo = Number(totalEfectivo || 0);
  const tarjeta = Number(totalTarjeta || 0);
  const transf = Number(totalTransferencia || 0);
  const ventas = Number(totalVentas || 0);
  const ordenes = Number(totalOrdenes || 0);
  const tarjetaMasTransf = tarjeta + transf;
  const fondo = Number(montoInicialActual || 0);

  const cells = [
    { 
      label: "Ventas Netas", 
      value: ventas, 
      currency: true,
      icon: TrendingUp,
      color: "text-indigo-600 bg-indigo-50 border-indigo-100/50"
    },
    { 
      label: "Tickets Cobrados", 
      value: ordenes, 
      currency: false,
      icon: Ticket,
      color: "text-amber-600 bg-amber-50 border-amber-100/50"
    },
    { 
      label: "Efectivo Recibido", 
      value: efectivo, 
      currency: true,
      icon: Coins,
      color: "text-emerald-600 bg-emerald-50 border-emerald-100/50"
    },
    { 
      label: "Tarjeta + Transf.", 
      value: tarjetaMasTransf, 
      currency: true,
      icon: CreditCard,
      color: "text-blue-600 bg-blue-50 border-blue-100/50"
    },
  ];

  return (
    <article className="rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02),0_12px_24px_rgba(0,0,0,0.02)] transition-all duration-300">
      <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-800">Resumen operativo del día</h3>
      
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {cells.map((cell) => {
          const Icon = cell.icon;
          return (
            <div key={cell.label} className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 hover:shadow-md hover:shadow-slate-100/30 transition-all duration-300">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400">{cell.label}</p>
                <span className={`flex h-7 w-7 items-center justify-center rounded-lg border shadow-inner ${cell.color}`}>
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2.5 text-lg font-black tabular-nums text-slate-800 tracking-tight">
                {cell.currency ? formatCurrency(cell.value, currencySymbol) : cell.value}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl shadow-indigo-950/15 relative overflow-hidden">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-200/90">
          Efectivo total esperado en caja (Fondo Inicial + Efectivo Ventas)
        </p>
        <p className="mt-1.5 text-3xl font-black tabular-nums tracking-tight text-white">
          {formatCurrency(montoEsperadoCalculado, currencySymbol)}
        </p>
        {fondo > 0 ? (
          <p className="mt-2 text-[10px] font-bold text-indigo-300 flex items-center gap-1.5 uppercase tracking-wider">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
            Fondo inicial base: {formatCurrency(fondo, currencySymbol)}
          </p>
        ) : null}
      </div>
    </article>
  );
}

