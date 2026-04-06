import { Printer, Download, X, CheckCircle2, ShoppingBag } from "lucide-react";
import { BackofficeDialog } from "./BackofficeDialog.jsx";
import { formatCurrency } from "../utils/currency.js";
import { APP_NAME } from "../../../config/brand.js";

export function PosReceiptModal({ open, onClose, saleData, currencySymbol = "C$" }) {
  if (!saleData) return null;

  const {
    id,
    items = [],
    total,
    pagadoConCordobas,
    pagadoConDolares,
    vuelto,
    exchangeRate,
    fecha = new Date().toLocaleString(),
    cliente = "Cliente General"
  } = saleData;

  const handlePrint = () => {
    window.print();
  };

  return (
    <BackofficeDialog open={open} onClose={onClose} title="Comprobante de Pago">
      <div className="flex flex-col items-center">
        {/* Visual Success Icon */}
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-inner">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <h3 className="text-2xl font-black text-slate-900 tracking-tight text-center">¡Venta Completada!</h3>
        <p className="mt-1 text-sm font-medium text-slate-400 text-center px-4">El inventario ha sido actualizado correctamente</p>

        {/* The "Paper" Ticket */}
        <div id="pos-receipt-content" className="mt-8 w-full max-w-[320px] overflow-hidden rounded-2xl bg-white border border-slate-100 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] font-mono text-[11px] text-slate-700">
          <div className="bg-slate-50/50 p-6 text-center space-y-1.5 border-b border-dashed border-slate-200">
            <p className="text-sm font-black uppercase text-slate-800 tracking-wider">{APP_NAME}</p>
            <p className="text-[9px] font-bold text-slate-400 uppercase">Sucursal Managua, Nicaragua</p>
          </div>

          <div className="p-6 space-y-4">
            <div className="flex flex-col gap-1 text-[10px] font-bold text-slate-400 uppercase">
              <div className="flex justify-between">
                <span>Factura</span>
                <span className="text-slate-800">#REC-{String(id || Math.floor(Math.random() * 10000)).padStart(5, '0')}</span>
              </div>
              <div className="flex justify-between">
                <span>Fecha</span>
                <span className="text-slate-800">{fecha}</span>
              </div>
              <div className="flex justify-between">
                <span>Cliente</span>
                <span className="text-slate-800 truncate max-w-[150px]">{cliente}</span>
              </div>
            </div>

            <div className="space-y-2 border-t border-b border-slate-100 py-4">
              {items.map((item, idx) => (
                <div key={idx} className="flex justify-between gap-3">
                  <span className="flex-1 text-slate-600">
                    <span className="font-black text-slate-900">{item.qty}x</span> {item.name || item.nombre}
                  </span>
                  <span className="shrink-0 font-bold text-slate-900">{formatCurrency(item.qty * (item.price || item.precio), "")}</span>
                </div>
              ))}
            </div>

            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between items-baseline">
                <span className="text-[10px] font-black uppercase text-slate-400">Total</span>
                <span className="text-xl font-black text-slate-900">{formatCurrency(total, currencySymbol)}</span>
              </div>
              
              <div className="space-y-1 opacity-70">
                {pagadoConCordobas > 0 && (
                  <div className="flex justify-between text-[10px] font-bold">
                    <span>Recibido C$</span>
                    <span>{formatCurrency(pagadoConCordobas, "C$")}</span>
                  </div>
                )}
                {pagadoConDolares > 0 && (
                  <div className="flex justify-between text-[10px] font-bold">
                    <span>Recibido USD</span>
                    <span>{formatCurrency(pagadoConDolares, "$")}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center rounded-xl bg-slate-900 p-3 mt-4 text-white">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Vuelto C$</span>
                <span className="text-lg font-black">{formatCurrency(vuelto, "C$")}</span>
              </div>
            </div>

            <div className="pt-6 text-center">
              <p className="text-[10px] font-black uppercase text-slate-800 tracking-[0.2em]">¡Gracias por su compra!</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-10 flex w-full gap-4 max-w-[320px]">
          <button
            onClick={handlePrint}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-slate-100 bg-white py-4 text-xs font-black text-slate-600 hover:bg-slate-50 active:scale-95 transition-all"
          >
            <Printer className="h-5 w-5" />
            PDF
          </button>
          <button
            onClick={onClose}
            className="flex flex-[1.5] items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 text-xs font-black text-white shadow-xl shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all"
          >
            NUEVA VENTA
          </button>
        </div>
      </div>
    </BackofficeDialog>
  );
}
