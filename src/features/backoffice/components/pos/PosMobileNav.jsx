import React from "react";
import { Package, ShoppingCart } from "lucide-react";

/**
 * Navegación inferior para dispositivos móviles en el POS.
 */
export function PosMobileNav({
  mobileTab,
  setMobileTab,
  cartCount,
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 grid grid-cols-2 border-t border-slate-200 bg-white/95 backdrop-blur-md shadow-[0_-8px_30px_rgb(0,0,0,0.04)] lg:hidden">
      <button
        onClick={() => setMobileTab("products")}
        className={`flex flex-col items-center justify-center py-4 transition-all ${
          mobileTab === "products" 
            ? "text-blue-600 border-t-2 border-blue-600 -mt-[2px]" 
            : "text-slate-400"
        }`}
      >
        <Package className={`h-5 w-5 ${mobileTab === "products" ? "scale-110" : ""}`} />
        <span className="mt-1 text-[10px] font-black uppercase tracking-widest">Catálogo</span>
      </button>

      <button
        onClick={() => setMobileTab("cart")}
        className={`flex flex-col items-center justify-center py-4 transition-all ${
          mobileTab === "cart" 
            ? "text-blue-600 border-t-2 border-blue-600 -mt-[2px]" 
            : "text-slate-400"
        }`}
      >
        <div className="relative">
          <ShoppingCart className={`h-5 w-5 ${mobileTab === "cart" ? "scale-110" : ""}`} />
          {cartCount > 0 && (
            <span className="absolute -right-2.5 -top-2.5 flex h-4.5 w-5 items-center justify-center rounded-full bg-red-600 text-[9px] font-black text-white shadow-lg ring-2 ring-white">
              {cartCount}
            </span>
          )}
        </div>
        <span className="mt-1 text-[10px] font-black uppercase tracking-widest">Carrito</span>
      </button>
    </div>
  );
}
