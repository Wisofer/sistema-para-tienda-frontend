import React from "react";
import { Search, Package } from "lucide-react";
import { BackofficeDialog } from "../../components/index.js";
import {
  modalFormBodyScrollPlainClass,
  modalFormFooterClass,
  modalFormRootClass,
} from "../../utils/modalResponsiveClasses.js";
import { cn } from "../../../../utils/cn.js";

/**
 * Modal para movimientos de stock (Entrada, Salida, Ajuste).
 */
export function StockMovementModal({
  stockModalOpen,
  setStockModalOpen,
  saving,
  stockMode,
  submitStockAction,
  stockProductQuery,
  setStockProductQuery,
  stockSuggestOpen,
  setStockSuggestOpen,
  stockSuggestBlurTimerRef,
  stockAutocompleteList,
  selectedStockProduct,
  stockForm,
  setStockForm,
}) {
  if (!stockModalOpen) return null;

  return (
    <BackofficeDialog onBackdropClick={saving ? undefined : () => setStockModalOpen(false)} maxWidthClass="max-w-md">
      <form onSubmit={submitStockAction} className={modalFormRootClass}>
        {/* Título dinámico */}
        <h3 className="shrink-0 text-lg font-bold tracking-tight text-slate-800">
          {stockMode === "entrada"
            ? "Entrada de Inventario"
            : stockMode === "salida"
            ? "Salida de Inventario"
            : "Ajuste de Stock"}
        </h3>
        <p className="mt-1 shrink-0 text-xs font-black uppercase tracking-widest text-slate-500">{stockMode}</p>

        <div className={cn(modalFormBodyScrollPlainClass, "space-y-4")}>
          {/* Buscador de Producto */}
          <div className="relative">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">
              Buscar producto (Mín 3 letras)
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={stockProductQuery}
                  onChange={(e) => {
                    setStockProductQuery(e.target.value);
                    setStockSuggestOpen(true);
                  }}
                  onFocus={() => setStockSuggestOpen(true)}
                  onBlur={() => {
                    stockSuggestBlurTimerRef.current = window.setTimeout(
                      () => setStockSuggestOpen(false),
                      200
                    );
                  }}
                  placeholder="Nombre o código..."
                  className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
            </label>

            {/* Sugerencias de Autocompletado */}
            {stockSuggestOpen && stockAutocompleteList.length > 0 && (
              <div className="absolute z-[100] mt-1 max-h-60 w-full overflow-auto rounded-xl border border-slate-200 bg-white p-1 shadow-2xl">
                {stockAutocompleteList.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setStockForm((f) => ({ ...f, productoId: String(p.id) }));
                      setStockProductQuery(p.nombre);
                      setStockSuggestOpen(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-slate-50"
                  >
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                      {p.imagen ? (
                        <img src={p.imagen} className="h-full w-full object-cover" />
                      ) : (
                        <Package className="m-auto h-5 w-5 text-slate-300" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-800">{p.nombre}</p>
                      <p className="text-[10px] text-slate-500 uppercase font-black tracking-tighter">
                        {p.categoria} • Stock: {p.stock}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Información del Producto Seleccionado */}
          {selectedStockProduct && (
            <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-3">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl ring-2 ring-white">
                  <img
                    src={selectedStockProduct.imagen || "https://placehold.co/100x100?text=IMG"}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://placehold.co/100x100?text=IMG";
                    }}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black text-slate-900 uppercase">
                    {selectedStockProduct.nombre}
                  </p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-500">
                      ACTUAL: {selectedStockProduct.stock}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">|</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">
                      {selectedStockProduct.talla}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Campos específicos según el Modo */}
          {stockMode === "entrada" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">
                  Cantidad
                  <input
                    type="number"
                    required
                    min="1"
                    value={stockForm.cantidad}
                    onChange={(e) => setStockForm((f) => ({ ...f, cantidad: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-300 py-3 px-4 text-sm font-black focus:border-blue-500 focus:outline-none"
                  />
                </label>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">
                  Costo Unitario
                  <input
                    type="number"
                    step="0.01"
                    value={stockForm.costoUnitario}
                    onChange={(e) => setStockForm((f) => ({ ...f, costoUnitario: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-300 py-3 px-4 text-sm font-black focus:border-blue-500 focus:outline-none"
                  />
                </label>
              </div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest">
                Factura Compra (Opcional)
                <input
                  type="text"
                  value={stockForm.numeroFactura}
                  onChange={(e) => setStockForm((f) => ({ ...f, numeroFactura: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-300 py-3 px-4 text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="Núm. Factura"
                />
              </label>
            </>
          )}

          {stockMode === "salida" && (
            <div className="grid grid-cols-1 gap-3">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">
                Motivo de Salida
                <select
                  value={stockForm.subtipo}
                  onChange={(e) => setStockForm((f) => ({ ...f, subtipo: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-300 py-3 px-4 text-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="Daño">Daño / Producto Defectuoso</option>
                  <option value="Vencimiento">Vencimiento</option>
                  <option value="Uso Interno">Uso Interno</option>
                  <option value="Perdida">Pérdida / Robo</option>
                  <option value="Devolución Proveedor">Devolución a Proveedor</option>
                </select>
              </label>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">
                Cantidad a Retirar
                <input
                  type="number"
                  required
                  min="1"
                  value={stockForm.cantidad}
                  onChange={(e) => setStockForm((f) => ({ ...f, cantidad: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-300 py-3 px-4 text-sm font-black text-red-600 focus:border-blue-500 focus:outline-none"
                />
              </label>
            </div>
          )}

          {stockMode === "ajuste" && (
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest">
              Cantidad Física Real (Nueva)
              <input
                type="number"
                required
                min="0"
                placeholder="Escribe el stock que hay en físico"
                value={stockForm.cantidadNueva}
                onChange={(e) => setStockForm((f) => ({ ...f, cantidadNueva: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-300 py-3 px-4 text-sm font-black text-blue-600 focus:border-blue-500 focus:outline-none"
              />
            </label>
          )}

          <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest">
            Observaciones
            <textarea
              value={stockForm.observaciones}
              onChange={(e) => setStockForm((f) => ({ ...f, observaciones: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-300 py-3 px-4 text-sm focus:border-blue-500 focus:outline-none"
              rows="2"
              placeholder="Justifica el movimiento..."
            />
          </label>
        </div>

        {/* Botones */}
        <div className={cn(modalFormFooterClass, "!flex-row flex-wrap gap-3")}>
          <button
            type="button"
            onClick={() => setStockModalOpen(false)}
            className="min-h-[44px] flex-1 rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-500 transition-colors hover:bg-slate-50 sm:min-h-0"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="min-h-[44px] flex-1 rounded-xl bg-slate-900 py-3 text-sm font-bold text-white shadow-xl shadow-slate-200 transition-all hover:bg-black active:scale-[0.98] disabled:opacity-50 sm:min-h-0"
          >
            {saving ? "Aplicando..." : "Confirmar"}
          </button>
        </div>
      </form>
    </BackofficeDialog>
  );
}
