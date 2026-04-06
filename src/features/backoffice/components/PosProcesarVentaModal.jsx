import { useEffect, useMemo, useState } from "react";
import { DEFAULT_TIPO_CAMBIO_USD, formatCurrency } from "../utils/currency.js";

/**
 * Modal "Procesar venta": Diseño Compacto y Centrado (Versión del Usuario)
 */
export function PosProcesarVentaModal({
  open,
  onClose,
  mesaLabel,
  currencySymbol = "C$",
  lines = [],
  totalOrdenBackend,
  exchangeRate,
  busy = false,
  onGuardar,
}) {
  const [descuento, setDescuento] = useState("");
  const [montoRecibido, setMontoRecibido] = useState("");
  const [tipoPago, setTipoPago] = useState("Efectivo");
  const [moneda, setMoneda] = useState("C$");
  const [comentario, setComentario] = useState("");
  
  const tc = Number(exchangeRate) > 0 ? Number(exchangeRate) : DEFAULT_TIPO_CAMBIO_USD;
  const isUsd = moneda === "USD";

  const subtotalLineas = useMemo(
    () => lines.reduce((s, x) => s + Number(x.lineTotal ?? (x.price || 0) * (x.qty || 0)), 0),
    [lines]
  );

  const descuentoNum = Math.max(0, Number(descuento) || 0);

  const totalDesdeBackend =
    totalOrdenBackend != null && Number.isFinite(Number(totalOrdenBackend)) ? Number(totalOrdenBackend) : null;
  
  const baseAntesDescuento =
    totalDesdeBackend != null && totalDesdeBackend > 0 ? totalDesdeBackend : subtotalLineas;
  const totalAPagarCordobas = Math.max(0, baseAntesDescuento - descuentoNum);
  const totalAPagarMoneda = isUsd ? totalAPagarCordobas / tc : totalAPagarCordobas;

  const recibidoNum = Number(montoRecibido) || 0;
  const recibidoCordobas = isUsd ? recibidoNum * tc : recibidoNum;
  const vueltoCordobas = tipoPago === "Efectivo" ? Math.max(0, recibidoCordobas - totalAPagarCordobas) : 0;
  const vueltoMoneda = isUsd ? vueltoCordobas / tc : vueltoCordobas;

  useEffect(() => {
    if (!open) return;
    setDescuento("");
    setComentario("");
    setTipoPago("Efectivo");
    setMoneda("C$");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setMontoRecibido(String(totalAPagarMoneda.toFixed(2)));
  }, [open, totalAPagarMoneda, moneda]);

  useEffect(() => {
    if (tipoPago !== "Efectivo") {
      setMontoRecibido(String(totalAPagarMoneda.toFixed(2)));
    }
  }, [tipoPago, totalAPagarMoneda, open]);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (tipoPago === "Efectivo" && recibidoCordobas + 1e-6 < totalAPagarCordobas) {
      return;
    }
    onGuardar?.({
      descuento: descuentoNum,
      subtotalLineas,
      totalAPagarCordobas,
      totalAPagarMoneda,
      montoRecibido: recibidoNum,
      montoRecibidoCordobas: recibidoCordobas,
      vueltoCordobas,
      vueltoMoneda,
      tipoCambioAplicado: tc,
      tipoPago,
      moneda,
      comentario: comentario.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <button type="button" className="absolute inset-0 cursor-default" onClick={onClose} disabled={busy}></button>
      
      <form
        onSubmit={handleSubmit}
        className="relative z-[201] flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        {/* Cabecera Compacta */}
        <div className="border-b border-slate-100 px-5 py-3">
          <h2 className="text-lg font-bold text-slate-800">Procesar venta</h2>
          <p className="text-[11px] font-medium text-slate-400">{mesaLabel || "VENTA DIRECTA"}</p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-2 scrollbar-hide">
          {/* Tabla Mini */}
          <div className="mt-2 overflow-hidden rounded-lg border border-slate-100">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-slate-50 text-slate-500 font-bold">
                <tr>
                  <th className="px-2 py-1.5 uppercase">Producto</th>
                  <th className="px-2 py-1.5 text-center uppercase">Cant.</th>
                  <th className="px-2 py-1.5 text-right uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {lines.map((row, i) => {
                  const pt = Number(row.lineTotal ?? (row.price || 0) * (row.qty || 0));
                  return (
                    <tr key={`${row.id}-${i}`} className="text-slate-600">
                      <td className="px-2 py-1.5 line-clamp-1">{row.name}</td>
                      <td className="px-2 py-1.5 text-center">{row.qty}</td>
                      <td className="px-2 py-1.5 text-right font-semibold">{formatCurrency(pt, currencySymbol)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Resumen de Totales */}
          <div className="mt-3 space-y-1.5 border-b border-slate-100 pb-3">
            <div className="flex justify-between text-xs text-slate-600">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotalLineas, currencySymbol)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Total descuento</span>
              <input
                type="number"
                value={descuento}
                onChange={(e) => setDescuento(e.target.value)}
                className="w-20 rounded border border-slate-200 px-2 py-0.5 text-right font-bold text-slate-800 focus:border-amber-500 focus:outline-none"
                placeholder="0.00"
              />
            </div>
            <div className="flex justify-between pt-1 text-lg font-black text-slate-900 border-t border-slate-50">
              <span className="uppercase text-sm">Total a pagar</span>
              <span>{formatCurrency(totalAPagarMoneda, isUsd ? "$" : currencySymbol)}</span>
            </div>
          </div>

          {/* Formulario Compacto (2 columnas) */}
          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400">Recibido ({moneda})</label>
              <input
                type="number"
                value={montoRecibido}
                onChange={(e) => setMontoRecibido(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-800 focus:border-amber-500 focus:outline-none"
                disabled={busy || tipoPago !== "Efectivo"}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400">Vuelto ({moneda})</label>
              <div className="w-full rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-black text-slate-800">
                {vueltoMoneda.toFixed(2)}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400">Pago</label>
              <select 
                value={tipoPago} 
                onChange={(e) => setTipoPago(e.target.value)} 
                className="w-full rounded-lg border border-slate-200 px-2 py-2 text-xs font-bold text-slate-700 focus:border-amber-500 focus:outline-none cursor-pointer"
              >
                <option>Efectivo</option>
                <option>Tarjeta</option>
                <option>Transferencia</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400">Moneda</label>
              <select 
                value={moneda} 
                onChange={(e) => setMoneda(e.target.value)} 
                className="w-full rounded-lg border border-slate-200 px-2 py-2 text-xs font-bold text-slate-700 focus:border-amber-500 focus:outline-none cursor-pointer"
              >
                <option value="C$">Córdobas (C$)</option>
                <option value="USD">Dólares ($)</option>
              </select>
            </div>
            <div className="col-span-2 space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400">Comentario</label>
              <textarea
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                rows={1}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 resize-none focus:border-amber-500 focus:outline-none"
                placeholder="Opcional..."
              />
            </div>
          </div>

          {tipoPago === "Efectivo" && recibidoCordobas + 1e-6 < totalAPagarCordobas && (
            <p className="mt-2 text-[10px] font-bold text-red-500 uppercase tracking-tight">Monto insuficiente</p>
          )}
        </div>

        {/* Botones */}
        <div className="flex gap-3 bg-white px-5 py-4 border-t border-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-red-100 py-3 text-xs font-bold text-red-500 transition hover:bg-red-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={busy || (tipoPago === "Efectivo" && recibidoCordobas + 1e-6 < totalAPagarCordobas)}
            className="flex-1 rounded-xl bg-amber-500 py-3 text-xs font-bold text-white shadow-lg shadow-amber-100 transition hover:bg-amber-600 disabled:bg-slate-200 disabled:shadow-none"
          >
            {busy ? "Procesando..." : "Cobrar"}
          </button>
        </div>
      </form>
    </div>
  );
}
