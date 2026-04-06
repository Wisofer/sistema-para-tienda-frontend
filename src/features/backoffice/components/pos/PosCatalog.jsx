import React from "react";
import { Package, Image as ImageIcon } from "lucide-react";
import { formatCurrency } from "../../utils/currency.js";

/**
 * Catálogo de productos para el POS.
 */
export function PosCatalog({
  products,
  currencySymbol,
  addToCart,
  cajaAbierta,
  actionBusy,
}) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <Package className="mb-2 h-16 w-16 opacity-20" />
        <p className="text-sm font-bold uppercase tracking-widest">No se encontraron productos</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 pb-24 sm:grid-cols-3 lg:grid-cols-4 lg:pb-8 xl:grid-cols-5 2xl:grid-cols-6">
      {products.map((p) => (
        <button
          key={p.id}
          onClick={() => addToCart(p)}
          disabled={!cajaAbierta || actionBusy}
          className="group relative flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-3 shadow-sm transition-all hover:border-blue-200 hover:shadow-xl hover:-translate-y-1 active:scale-[0.96] disabled:opacity-50"
        >
          {/* Imagen con Aspect Ratio controlado */}
          <div className="mb-3 aspect-square w-full overflow-hidden rounded-xl bg-slate-50 flex items-center justify-center ring-1 ring-slate-50">
            {p.imagen ? (
              <img
                src={p.imagen}
                alt={p.nombre}
                className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-110"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.parentNode.innerHTML = '<div class="flex items-center justify-center h-full w-full text-slate-300"><svg class="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg></div>';
                }}
                loading="lazy"
              />
            ) : (
              <ImageIcon className="h-8 w-8 text-slate-300" />
            )}
          </div>

          {/* Información del Producto */}
          <div className="flex flex-1 flex-col text-left">
            <p className="line-clamp-1 text-[11px] font-black text-slate-600 uppercase tracking-tight">
              {p.nombre || "Producto"}
            </p>
            <div className="mt-2 flex items-center justify-between">
              <div>
                <p className="text-sm font-black text-blue-600 tracking-tighter">
                  {formatCurrency(p.precioVenta ?? p.precio ?? 0, currencySymbol)}
                </p>
                <div className="flex items-center gap-1.5 pt-0.5">
                    <span 
                        className={`text-[8px] font-black uppercase tracking-widest ${
                            p.stock <= 5 ? "text-red-600 animate-pulse" : "text-slate-400"
                        }`}
                    >
                        Stock: {p.stock}
                    </span>
                    {p.talla && (
                        <span className="rounded bg-slate-100 px-1 text-[8px] font-bold text-slate-500">
                            {p.talla}
                        </span>
                    )}
                </div>
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
