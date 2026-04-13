import React, { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { formatCurrency } from "../../utils/currency.js";
import { reporteMetodoPagoLabel, reporteMonedaLabel } from "../../utils/reportUtils.js";
import { VentaCancelacionModal } from "./VentaCancelacionModal.jsx";

function estadoEsAnulado(estado) {
  const s = String(estado || "").toLowerCase();
  return s.includes("anul");
}

/**
 * Modal de detalle de venta/ticket. Incluye anulación total y devolución parcial (Admin + PIN).
 */
export function OrderDetailModal({
  open,
  onClose,
  loading,
  order,
  currencySymbol,
  /** Tras anular/devolver: refrescar listado de reportes */
  onSuccessAfterMutation,
}) {
  const [selectedDetalleIds, setSelectedDetalleIds] = useState([]);
  const [cancelModal, setCancelModal] = useState({ open: false, mode: "total" });

  useEffect(() => {
    if (!open || !order) return;
    setSelectedDetalleIds([]);
    setCancelModal({ open: false, mode: "total" });
  }, [open, order?.numero, order?.ventaId]);

  const ventaId = order?.ventaId != null ? Number(order.ventaId) : null;
  const isTicket = order?.kind === "ticket";
  const anulada = estadoEsAnulado(order?.estado);
  const items = order?.items || order?.Items || [];

  const lineasSeleccionables = useMemo(() => {
    return items.filter((it) => it.detalleId != null && it.detalleId > 0 && !it.anulado);
  }, [items]);

  const puedeAnularTotal =
    isTicket && ventaId != null && Number.isFinite(ventaId) && ventaId > 0 && !anulada;

  const puedeDevolucionParcial =
    puedeAnularTotal && lineasSeleccionables.length > 0;

  const toggleDetalle = (id) => {
    const n = Number(id);
    if (!Number.isFinite(n) || n <= 0) return;
    setSelectedDetalleIds((prev) =>
      prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]
    );
  };

  const seleccionarTodas = () => {
    setSelectedDetalleIds(lineasSeleccionables.map((l) => l.detalleId));
  };

  const limpiarSeleccion = () => setSelectedDetalleIds([]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
        <article className="max-h-[85vh] w-full max-w-3xl overflow-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
          <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="text-lg font-bold text-slate-800 uppercase tracking-tight">
              Detalle de venta
            </h4>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-300 text-slate-700 transition-colors hover:bg-slate-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-sm font-medium text-slate-500">
              Cargando detalle de la orden...
            </div>
          ) : !order ? (
            <div className="py-12 text-center text-sm font-medium text-slate-500">
              Sin información para mostrar.
            </div>
          ) : (
            <div className="space-y-6">
              {anulada && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
                  Esta venta está <strong>anulada</strong>. No se pueden registrar nuevas devoluciones desde aquí.
                </div>
              )}

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
                <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-100 bg-white p-3 text-xs sm:grid-cols-2">
                  <div>
                    <p className="font-black text-slate-400 uppercase tracking-widest">Método de pago</p>
                    <p className="font-bold text-slate-900">{reporteMetodoPagoLabel(order.metodoPago)}</p>
                  </div>
                  <div>
                    <p className="font-black text-slate-400 uppercase tracking-widest">Moneda</p>
                    <p className="font-bold text-slate-900">{reporteMonedaLabel(order.moneda)}</p>
                  </div>
                </div>
              )}

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
                    <p className="font-bold text-slate-900">
                      {formatCurrency(order.subtotalLineas ?? 0, currencySymbol)}
                    </p>
                  </div>
                  <div>
                    <p className="font-black text-slate-400 uppercase tracking-widest">Total cobrado</p>
                    <p className="font-bold text-emerald-700">
                      {formatCurrency(order.totalCobrado ?? order.total ?? 0, currencySymbol)}
                    </p>
                  </div>
                </div>
              )}

              {puedeAnularTotal && (
                <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                  <button
                    type="button"
                    onClick={() => setCancelModal({ open: true, mode: "total" })}
                    className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
                  >
                    Cancelar venta
                  </button>
                  {puedeDevolucionParcial ? (
                    <>
                      <button
                        type="button"
                        onClick={seleccionarTodas}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Seleccionar líneas activas
                      </button>
                      <button
                        type="button"
                        onClick={limpiarSeleccion}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Limpiar selección
                      </button>
                      <button
                        type="button"
                        disabled={selectedDetalleIds.length === 0}
                        onClick={() => setCancelModal({ open: true, mode: "partial" })}
                        className="rounded-lg border border-amber-600 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Devolver líneas seleccionadas ({selectedDetalleIds.length})
                      </button>
                    </>
                  ) : (
                    !anulada && (
                      <p className="self-center text-[11px] text-slate-500">
                        La devolución por líneas solo está disponible cuando cada producto del ticket viene identificado por
                        el sistema.
                      </p>
                    )
                  )}
                </div>
              )}

              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="min-w-full text-sm">
                  <thead className="border-b border-slate-200 bg-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    <tr>
                      {puedeDevolucionParcial && !anulada ? (
                        <th className="w-10 px-2 py-3 text-center"> </th>
                      ) : null}
                      <th className="px-4 py-3 text-left">Producto</th>
                      <th className="px-4 py-3 text-center">Cantidad</th>
                      <th className="px-4 py-3 text-right">P/U</th>
                      <th className="px-4 py-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {items.length === 0 ? (
                      <tr>
                        <td
                          colSpan={puedeDevolucionParcial && !anulada ? 5 : 4}
                          className="px-4 py-8 text-center font-medium italic text-slate-400"
                        >
                          Sin productos registrados en esta orden.
                        </td>
                      </tr>
                    ) : (
                      items.map((it, i) => {
                        const lineAnulada = Boolean(it.anulado);
                        const did = it.detalleId;
                        const canSelect =
                          puedeDevolucionParcial &&
                          !anulada &&
                          did != null &&
                          Number(did) > 0 &&
                          !lineAnulada;
                        const checked = did != null && selectedDetalleIds.includes(Number(did));
                        return (
                          <tr
                            key={`${did ?? it.id ?? i}`}
                            className={`transition-colors hover:bg-slate-50/50 ${lineAnulada ? "bg-slate-50 opacity-75" : ""}`}
                          >
                            {puedeDevolucionParcial && !anulada ? (
                              <td className="px-2 py-3 text-center">
                                {canSelect ? (
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => toggleDetalle(did)}
                                    className="h-4 w-4 rounded border-slate-300"
                                    aria-label={`Seleccionar línea ${did}`}
                                  />
                                ) : (
                                  <span className="text-slate-300">—</span>
                                )}
                              </td>
                            ) : null}
                            <td className="px-4 py-3 font-bold uppercase tracking-tight text-slate-800">
                              <span className={lineAnulada ? "line-through" : ""}>
                                {[it.producto || it.servicio || "-", it.variante ? `(${it.variante})` : ""]
                                  .filter(Boolean)
                                  .join(" ")}
                              </span>
                              {lineAnulada ? (
                                <span className="ml-2 rounded bg-slate-200 px-1.5 py-0.5 text-[9px] font-black uppercase text-slate-600">
                                  Anulado
                                </span>
                              ) : null}
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
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end p-2">
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {order.kind === "ticket" ? "Total cobrado" : "Total de la Orden"}
                  </p>
                  <p className="text-2xl font-black text-blue-600">
                    {formatCurrency(
                      order.kind === "ticket"
                        ? (order.totalCobrado ?? order.total ?? 0)
                        : order.total || order.monto || 0,
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

      <VentaCancelacionModal
        open={cancelModal.open}
        onClose={() => setCancelModal({ open: false, mode: "total" })}
        ventaId={ventaId}
        mode={cancelModal.mode}
        detalleIds={cancelModal.mode === "partial" ? selectedDetalleIds : []}
        onSuccess={() => {
          onSuccessAfterMutation?.();
          onClose();
        }}
      />
    </>
  );
}
