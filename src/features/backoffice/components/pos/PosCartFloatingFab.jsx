import React from "react";
import { ShoppingCart } from "lucide-react";

/**
 * Botón flotante (solo lg): abre de nuevo el panel del carrito y muestra la cantidad de unidades.
 */
export function PosCartFloatingFab({ cartCount, onOpenCart }) {
  return (
    <button
      type="button"
      onClick={onOpenCart}
      className="fixed bottom-6 right-6 z-[55] hidden h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg ring-4 ring-white/40 transition hover:scale-105 hover:bg-black active:scale-95 lg:flex"
      aria-label="Abrir carrito"
      title="Ver carrito"
    >
      <ShoppingCart className="h-6 w-6 shrink-0" />
      {cartCount > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-h-5 min-w-[1.25rem] max-w-[2rem] items-center justify-center rounded-full bg-red-600 px-0.5 text-[9px] font-bold leading-none tabular-nums text-white ring-1 ring-white">
          {cartCount > 99 ? "99+" : cartCount}
        </span>
      ) : null}
    </button>
  );
}
