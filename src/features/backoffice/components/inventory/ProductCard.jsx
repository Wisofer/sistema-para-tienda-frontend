import React from "react";
import { Pencil, History, Trash2, Image as ImageIcon } from "lucide-react";
import { formatCurrency } from "../../utils/currency.js";

/**
 * Tarjeta individual de producto para la vista de inventario.
 */
export function ProductCard({
  product,
  currencySymbol,
  openEdit,
  openProductHistory,
  setConfirmAction,
}) {
  const p = product;
  const stock = Number(p.stock || 0);
  const min = Number(p.stockMinimo || 0);
  const lowStock = Boolean(p.controlarStock) && min > 0 && stock <= min;
  const criticalStock = Boolean(p.controlarStock) && min > 0 && stock <= min * 0.5;

  return (
    <article
      className={`group relative flex min-h-[300px] flex-col justify-between rounded-xl border border-slate-100 bg-white p-3 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 ${
        p.activo === false ? "opacity-50" : "bg-white"
      }`}
    >
      {/* Indicador de bajo stock */}
      {lowStock && (
        <div
          className={`absolute right-2 top-2 z-10 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[9px] font-black tracking-widest shadow-lg ${
            criticalStock ? "bg-red-600 text-white animate-pulse" : "bg-amber-500 text-white"
          }`}
        >
          {criticalStock ? "CRITICO" : "BAJO STOCK"}
        </div>
      )}

      <div>
        {/* Contenedor de Imagen */}
        <div className="mb-3 h-32 w-full overflow-hidden rounded-lg bg-slate-100 flex items-center justify-center ring-1 ring-slate-100/50 sm:h-36">
          {p.imagen ? (
            <img
              src={p.imagen}
              alt={p.nombre}
              className="h-full w-full object-top object-cover transition-transform duration-700 group-hover:scale-110"
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = "none";
                e.target.parentNode.innerHTML =
                  '<div class="flex items-center justify-center h-full w-full text-slate-300"><svg class="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg></div>';
              }}
              loading="lazy"
            />
          ) : (
            <ImageIcon className="h-8 w-8 text-slate-300" />
          )}
        </div>

        {/* Información del Producto */}
        <p className="line-clamp-2 text-[10px] font-black text-slate-700 uppercase tracking-tight leading-tight">
          {p.nombre || "Producto"}
        </p>
        <div className="mt-1 flex flex-wrap gap-1">
          <p className="text-[9px] font-bold text-slate-400 uppercase">
            {p.categoria || "Stock"}
          </p>
          {p.codigo && (
            <span className="text-[9px] font-black text-blue-500 opacity-50">
              • {p.codigo}
            </span>
          )}
        </div>

        <div className="mt-1.5 flex flex-wrap gap-1">
          {p.talla && (
            <span className="rounded bg-slate-50 px-1 py-0.5 text-[8px] font-black text-slate-500 border border-slate-100">
              T: {p.talla}
            </span>
          )}
        </div>
      </div>

      {/* Footer de la tarjeta con Precios y Stock */}
      <div className="mt-3 border-t border-slate-50 pt-2">
        <div className="flex items-baseline justify-between mb-1">
          <p className="text-xs font-black text-blue-600">
            {formatCurrency(p.precioVenta ?? p.precio ?? 0, currencySymbol)}
          </p>
          <p className="text-[8px] font-black text-slate-300">
            C: {formatCurrency(p.precioCompra ?? 0, currencySymbol)}
          </p>
        </div>
        <div className="flex items-center justify-between">
          <p
            className={`text-[10px] font-black ${
              lowStock ? (criticalStock ? "text-red-600" : "text-amber-600") : "text-slate-500"
            }`}
          >
            {p.controlarStock ? `STOCK: ${stock}` : "SIN CONTROL"}
          </p>

          {/* Acciones Rápidas */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => openEdit(p.id)}
              className="p-1 text-slate-400 hover:text-blue-500 transition-colors"
              title="Editar"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => openProductHistory(p)}
              className="p-1 text-slate-400 hover:text-indigo-500 transition-colors"
              title="Historial"
            >
              <History className="h-4 w-4" />
            </button>
            <button
              onClick={() =>
                setConfirmAction({
                  open: true,
                  type: "product",
                  id: p.id,
                  name: p.nombre || "Producto",
                })
              }
              className="p-1 text-slate-400 hover:text-red-500 transition-colors"
              title="Eliminar"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
