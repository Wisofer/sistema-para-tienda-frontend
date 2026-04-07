import React from "react";
import { X } from "lucide-react";
import { formatCurrency } from "../../utils/currency.js";

/**
 * Modal para visualizar el detalle de una orden/factura.
 */
export function OrderDetailModal({
  open,
  onClose,
  loading,
  order,
  currencySymbol,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <article className="max-h-[85vh] w-full max-w-3xl overflow-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
          <h4 className="text-lg font-bold text-slate-800 uppercase tracking-tight">
            Detalle de venta
          </h4>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-slate-500 font-medium">
            Cargando detalle de la orden...
          </div>
        ) : !order ? (
          <div className="py-12 text-center text-sm text-slate-500 font-medium">
            Sin información para mostrar.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Resumen de la Orden */}
            <div className="grid grid-cols-1 gap-4 rounded-xl bg-slate-50 p-4 text-xs sm:grid-cols-2 md:grid-cols-4">
              <div className="space-y-1">
                <p className="font-black text-slate-400 uppercase tracking-widest">Número</p>
                <p className="font-bold text-slate-900">{order.numero || order.codigo || "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="font-black text-slate-400 uppercase tracking-widest">Estado</p>
                <p className="font-bold text-slate-900 uppercase">{order.estado || "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="font-black text-slate-400 uppercase tracking-widest">Referencia/Cliente</p>
                <p className="font-bold text-slate-900">{order.clienteNombre || order.mesa || "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="font-black text-slate-400 uppercase tracking-widest">Fecha</p>
                <p className="font-bold text-slate-900">{order.fecha || "-"}</p>
              </div>
            </div>

            {order.kind === "ticket" && (
              <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-100 bg-white p-3 text-xs sm:grid-cols-4">
                <div>
                  <p className="font-black text-slate-400 uppercase tracking-widest">Productos</p>
                  <p className="font-bold text-slate-900">{order.cantidadLineas ?? "—"}</p>
                </div>
                <div>
                  <p className="font-black text-slate-400 uppercase tracking-widest">Unidades</p>
                  <p className="font-bold text-slate-900">{order.cantidadUnidades ?? "—"}</p>
                </div>
                <div>
                  <p className="font-black text-slate-400 uppercase tracking-widest">Subtotal</p>
                  <p className="font-bold text-slate-900">{formatCurrency(order.subtotalLineas ?? 0, currencySymbol)}</p>
                </div>
                <div>
                  <p className="font-black text-slate-400 uppercase tracking-widest">Total cobrado</p>
                  <p className="font-bold text-emerald-700">{formatCurrency(order.totalCobrado ?? order.total ?? 0, currencySymbol)}</p>
                </div>
              </div>
            )}

            {/* Tabla de Items */}
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="min-w-full text-sm">
                <thead className="border-b border-slate-200 bg-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <tr>
                    <th className="px-4 py-3 text-left">Producto</th>
                    <th className="px-4 py-3 text-center">Cantidad</th>
                    <th className="px-4 py-3 text-right">P/U</th>
                    <th className="px-4 py-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {(order.items || order.Items || []).length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-400 font-medium italic">
                        Sin productos registrados en esta orden.
                      </td>
                    </tr>
                  ) : (
                    (order.items || order.Items || []).map((it, i) => (
                      <tr key={`${it.id || i}`} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 font-bold text-slate-800 uppercase tracking-tight">
                          {[it.producto || it.servicio || "-", it.variante ? `(${it.variante})` : ""]
                            .filter(Boolean)
                            .join(" ")}
                        </td>
                        <td className="px-4 py-3 text-center font-black text-slate-600">
                          {it.cantidad || 0}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-slate-500">
                          {formatCurrency(it.precioUnitario || 0, currencySymbol)}
                        </td>
                        <td className="px-4 py-3 text-right font-black text-slate-900">
                          {formatCurrency(it.monto || it.subtotal || 0, currencySymbol)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Total */}
            <div className="flex justify-end p-2">
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {order.kind === "ticket" ? "Total cobrado" : "Total de la Orden"}
                </p>
                <p className="text-2xl font-black text-blue-600">
                  {formatCurrency(
                    order.kind === "ticket" ? order.totalCobrado ?? order.total ?? 0 : order.total || order.monto || 0,
                    currencySymbol
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
        
        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
        >
          Cerrar detalle
        </button>
      </article>
    </div>
  );
}
