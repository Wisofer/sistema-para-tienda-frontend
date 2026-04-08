import React from "react";
import { PanelRightClose, ShoppingCart, Trash2, Minus, Plus, Save, Image as ImageIcon } from "lucide-react";
import { formatCurrency } from "../../utils/currency.js";
import { offlineButtonTitle } from "../../../../constants/networkUi.js";
import { compactVarianteEtiquetaCarrito } from "../../utils/posVariantes.js";

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
  isOnline = true,
  cajaAbierta = true,
  /** Solo escritorio: oculta el panel y muestra el botón flotante (más espacio al catálogo). */
  onRequestMinimize,
}) {
  return (
    <aside className="flex h-full w-full flex-col overflow-hidden bg-white lg:w-96 lg:rounded-2xl lg:border lg:border-slate-200 shadow-sm">
      {/* Header del Carrito */}
      <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-slate-100 bg-white px-3 py-2.5 sm:px-4">
        <h3 className="flex min-w-0 items-center gap-1.5 text-xs font-bold uppercase tracking-tight text-slate-800">
          <ShoppingCart className="h-4 w-4 shrink-0 text-blue-600" />
          Carrito
        </h3>
        <div className="flex shrink-0 items-center gap-1">
          {onRequestMinimize ? (
            <button
              type="button"
              onClick={onRequestMinimize}
              className="hidden lg:inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-800"
              title="Más espacio para ver productos"
              aria-label="Minimizar carrito"
            >
              <PanelRightClose className="h-4 w-4" />
            </button>
          ) : null}
          <button
            type="button"
            onClick={handleClearCart}
            disabled={cart.length === 0 || actionBusy}
            className="rounded-md bg-red-50 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-red-600 hover:bg-red-100 disabled:opacity-30 transition-colors"
          >
            Vaciar
          </button>
        </div>
      </div>

      {/* Listado de Items en el Carrito */}
      <div className="flex-1 space-y-1.5 overflow-y-auto px-2.5 py-2 scrollbar-hide sm:px-3">
        {cart.map((item) => (
          <div
            key={item.lineId}
            className="group relative flex gap-2 rounded-lg border border-slate-100 bg-white p-2 shadow-sm transition-all hover:border-blue-200/80"
          >
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-slate-50 ring-1 ring-slate-100">
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
                  <ImageIcon className="h-4 w-4" />
                </div>
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col justify-between gap-0.5">
              <div>
                <p className="line-clamp-2 text-[10px] font-bold uppercase leading-tight tracking-tight text-slate-800">
                  {item.name}
                </p>
                {(() => {
                  const label = compactVarianteEtiquetaCarrito(item.opcionesResumen, item.talla);
                  if (!label) return null;
                  return (
                    <p className="mt-0.5 truncate text-[9px] font-semibold text-slate-500">{label}</p>
                  );
                })()}
              </div>

              <div className="mt-1 flex items-center justify-between gap-2">
                <div className="flex items-center gap-0.5 rounded-md bg-slate-100 px-1 py-0.5 ring-1 ring-slate-200/80">
                  <button
                    type="button"
                    onClick={() => handleUpdateQty(item.lineId, -1)}
                    className="rounded p-0.5 text-slate-500 hover:text-red-500 transition-colors"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="min-w-[1.25rem] text-center text-[10px] font-black tabular-nums text-slate-900">
                    {item.qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleUpdateQty(item.lineId, 1)}
                    className="rounded p-0.5 text-slate-500 hover:text-blue-600 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="shrink-0 text-xs font-black tabular-nums tracking-tight text-slate-900">
                  {formatCurrency(item.price * item.qty, currencySymbol)}
                </p>
              </div>
            </div>

            <button
              type="button"
              className="absolute -right-1 -top-1 hidden h-6 w-6 items-center justify-center rounded-full border border-white bg-red-100 text-red-600 shadow-sm group-hover:flex"
              onClick={() => handleRemoveFromCart(item.lineId)}
              aria-label="Quitar"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}

        {cart.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-300">
            <ShoppingCart className="mb-1.5 h-12 w-12 opacity-10" />
            <p className="text-xs font-bold uppercase tracking-widest">Carrito vacío</p>
          </div>
        )}
      </div>

      {/* Resumen de Pago y Checkout */}
      <div className="sticky bottom-0 border-t border-slate-100 bg-white p-3 sm:p-4 lg:rounded-b-2xl">
        {!cajaAbierta && (
          <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
            <p className="text-[11px] font-black uppercase tracking-widest text-amber-800">
              Caja cerrada
            </p>
            <p className="mt-0.5 text-[11px] leading-snug text-amber-700">
              Abre la caja para poder cobrar ventas.
            </p>
          </div>
        )}
        <div className="mb-3 space-y-1">
          <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <span>Subtotal</span>
            <span className="text-slate-600">{formatCurrency(subtotal, currencySymbol)}</span>
          </div>
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-xs font-black uppercase tracking-tight text-slate-900">Total</span>
            <span className="text-2xl font-black tabular-nums tracking-tight text-blue-600">
              {formatCurrency(subtotal, currencySymbol)}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCheckout}
          disabled={cart.length === 0 || actionBusy || !isOnline || !cajaAbierta}
          title={offlineButtonTitle(isOnline)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-xs font-black uppercase tracking-wide text-white shadow-md transition-all hover:bg-black active:scale-[0.99] disabled:bg-slate-200 disabled:shadow-none"
        >
          <Save className="h-4 w-4" />
          Cobrar venta
        </button>
      </div>
    </aside>
  );
}
