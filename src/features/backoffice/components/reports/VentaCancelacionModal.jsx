import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { backofficeApi } from "../../services/backofficeApi.js";

/**
 * Anulación total o devolución parcial (PIN + motivo opcional).
 * @param {'total' | 'partial'} mode
 * @param {number[]} detalleIds — obligatorio si mode === 'partial'
 */
export function VentaCancelacionModal({
  open,
  onClose,
  ventaId,
  mode = "total",
  detalleIds = [],
  onSuccess,
}) {
  const [codigo, setCodigo] = useState("");
  const [motivo, setMotivo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setCodigo("");
    setMotivo("");
    setError("");
  }, [open, ventaId, mode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const vid = Number(ventaId);
    if (!Number.isFinite(vid) || vid <= 0) {
      setError("ID de venta no válido.");
      return;
    }
    const pin = String(codigo || "").trim();
    if (!pin) {
      setError("Ingresa el código de confirmación.");
      return;
    }
    if (mode === "partial") {
      const ids = (detalleIds || []).map(Number).filter((n) => Number.isFinite(n) && n > 0);
      if (ids.length === 0) {
        setError("Seleccione al menos una línea para devolver.");
        return;
      }
    }
    setLoading(true);
    setError("");
    try {
      if (mode === "total") {
        await backofficeApi.ventaCancelar(vid, {
          codigo: pin,
          ...(String(motivo).trim() ? { motivo: String(motivo).trim() } : {}),
        });
      } else {
        const ids = (detalleIds || []).map(Number).filter((n) => Number.isFinite(n) && n > 0);
        await backofficeApi.ventaCancelarParcial(vid, {
          codigo: pin,
          detalleIds: ids,
          ...(String(motivo).trim() ? { motivo: String(motivo).trim() } : {}),
        });
      }
      onSuccess?.();
      onClose?.();
    } catch (err) {
      setError(err?.message || "No se pudo completar la operación.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const title = mode === "total" ? "Cancelar venta" : "Devolución parcial";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !loading) onClose?.();
      }}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          disabled={loading}
          onClick={onClose}
          className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" />
        </button>
        <form onSubmit={handleSubmit} className="space-y-4 pr-8">
          <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
          <p className="text-xs leading-relaxed text-slate-600">Ingresa el código de confirmación.</p>
          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          ) : null}
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
              Código de confirmación
            </label>
            <input
              type="password"
              autoComplete="off"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder=""
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
              Motivo (opcional)
            </label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Ej. Cliente devolvió el pedido"
            />
          </div>
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Cerrar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {loading
                ? "Procesando…"
                : mode === "total"
                  ? "Confirmar cancelación"
                  : "Confirmar devolución"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
