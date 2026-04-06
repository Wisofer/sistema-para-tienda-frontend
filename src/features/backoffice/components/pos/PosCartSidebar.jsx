import React from "react";
import { ShoppingCart, Trash2, Minus, Plus, Save, Image as ImageIcon } from "lucide-react";
import { formatCurrency } from "../../utils/currency.js";

/**
 * Sidebar del carrito de compra en el POS.
 */
export function PosCartSidebar({
  cart,
  handleUpdateQty,
  handleRemoveFromCart,
  handleClearCart,
  handleCheckout,
  subtotal,
  currencySymbol,
  actionBusy,
}) {
  return (
    <aside className="flex h-full w-full flex-col overflow-hidden bg-white lg:w-96 lg:rounded-2xl lg:border lg:border-slate-200 shadow-sm">
      {/* Header del Carrito */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
        <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 uppercase tracking-tight">
          <ShoppingCart className="h-5 w-5 text-blue-600" />
          Carrito de Venta
        </h3>
        <button
          onClick={handleClearCart}
          disabled={cart.length === 0 || actionBusy}
          className="rounded-lg bg-red-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-red-600 hover:bg-red-100 disabled:opacity-30 transition-colors"
        >
          VACIAR
        </button>
      </div>

      {/* Listado de Items en el Carrito */}
      <div className="flex-1 space-y-3 overflow-y-auto p-4 scrollbar-hide">
        {cart.map((item) => (
          <div
            key={item.lineId}
            className="group relative flex gap-3 rounded-2xl border border-slate-100 p-3 shadow-sm hover:border-blue-200 transition-all bg-white"
          >
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-50 ring-1 ring-slate-100">
              {item.imagen ? (
                <img
                  src={item.imagen}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.parentNode.innerHTML = '<div class="flex h-full w-full items-center justify-center text-slate-300"><svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg></div>';
                  }}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-slate-300">
                  <ImageIcon className="h-5 w-5" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1 flex flex-col justify-between">
              <div>
                <p className="line-clamp-1 text-[11px] font-black text-slate-800 uppercase tracking-tight">
                  {item.name}
                </p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {item.talla && (
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-500 uppercase">
                      {item.talla}
                    </span>
                  )}
                  {item.opcionesResumen && (
                      <span className="text-[9px] text-blue-500 font-medium italic">
                          {item.opcionesResumen}
                      </span>
                  )}
                </div>
              </div>

              <div className="mt-1.5 flex items-center justify-between">
                <div className="flex items-center gap-2 rounded-xl bg-slate-100 px-2 py-1 ring-1 ring-slate-200">
                  <button
                    onClick={() => handleUpdateQty(item.lineId, -1)}
                    className="rounded-lg p-1 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="text-xs font-black text-slate-900">{item.qty}</span>
                  <button
                    onClick={() => handleUpdateQty(item.lineId, 1)}
                    className="rounded-lg p-1 text-slate-400 hover:text-blue-500 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-sm font-black text-slate-900 tracking-tighter">
                  {formatCurrency(item.price * item.qty, currencySymbol)}
                </p>
              </div>
            </div>

            {/* Botón de Eliminar Item (Visible on Hover) */}
            <button
              className="absolute -right-2 -top-2 hidden h-7 w-7 items-center justify-center rounded-full bg-red-100 text-red-600 shadow-xl border-2 border-white group-hover:flex transition-all hover:scale-110"
              onClick={() => handleRemoveFromCart(item.lineId)}
            >
              <Trash2 className="h-4.5 w-4.5" />
            </button>
          </div>
        ))}

        {cart.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-slate-300">
            <ShoppingCart className="mb-2 h-16 w-16 opacity-10" />
            <p className="text-sm font-bold uppercase tracking-widest">Carrito vacío</p>
          </div>
        )}
      </div>

      {/* Resumen de Pago y Checkout */}
      <div className="sticky bottom-0 bg-white p-5 border-t border-slate-100 lg:rounded-b-2xl">
        <div className="mb-5 space-y-2">
          <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-400">
            <span>Subtotal</span>
            <span className="text-slate-600">{formatCurrency(subtotal, currencySymbol)}</span>
          </div>
          <div className="flex justify-between items-baseline pt-2">
            <span className="text-sm font-black uppercase tracking-widest text-slate-900">Total a Pagar</span>
            <span className="text-3xl font-black text-blue-600 tracking-tighter">
              {formatCurrency(subtotal, currencySymbol)}
            </span>
          </div>
        </div>

        <button
          onClick={handleCheckout}
          disabled={cart.length === 0 || actionBusy}
          className="flex w-full items-center justify-center gap-3 rounded-2xl bg-slate-900 py-4 text-sm font-black text-white shadow-xl shadow-slate-200 transition-all hover:bg-black hover:-translate-y-1 active:scale-[0.98] disabled:bg-slate-200 disabled:shadow-none disabled:-translate-y-0"
        >
          <Save className="h-5 w-5" />
          COBRAR VENTA
        </button>
      </div>
    </aside>
  );
}
