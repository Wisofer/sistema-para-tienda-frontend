import { formatCurrency } from "../utils/currency.js";
import { labelVarianteResumen, normalizeProductoVariantes } from "../utils/posVariantes.js";

/**
 * Elige talla/SKU antes de agregar al carrito (obligatorio si el producto tiene variantes en BD).
 */
export function PosVariantModal({ open, product, currencySymbol = "C$", onClose, onSelectVariant }) {
  if (!open || !product) return null;

  const variantes = normalizeProductoVariantes(product);
  const base = Number(product.precioVenta ?? product.precio ?? 0);

  return (
    <div className="fixed inset-0 z-[190] flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4">
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Cerrar" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pos-variant-title"
        className="relative z-[191] flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:rounded-2xl"
      >
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 id="pos-variant-title" className="text-base font-semibold text-slate-900">
            Elegir talla / variante
          </h2>
          <p className="text-xs text-slate-500">{product.nombre}</p>
          <p className="mt-1 text-[11px] text-slate-500">
            Con inventario activo, cada línea debe indicar la variante para descontar el stock correcto.
          </p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2 sm:px-4">
          {variantes.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">No hay variantes disponibles.</p>
          ) : (
            <ul className="space-y-2">
              {variantes.map((v) => {
                const unit = base + (v.precioAdicional || 0);
                const sinStock = product.controlarStock && Number(v.stock) <= 0;
                return (
                  <li key={v.id}>
                    <button
                      type="button"
                      disabled={sinStock}
                      onClick={() => onSelectVariant?.(v)}
                      className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-3 text-left transition hover:border-amber-300 hover:bg-amber-50/50 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-900">{labelVarianteResumen(v)}</p>
                        {v.sku ? (
                          <p className="text-[11px] font-mono text-slate-500">{v.sku}</p>
                        ) : null}
                        <p className="text-[11px] text-slate-500">
                          Stock: {Number.isFinite(v.stock) ? v.stock : "—"}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-bold text-blue-600">
                        {formatCurrency(unit, currencySymbol)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <div className="border-t border-slate-100 px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
