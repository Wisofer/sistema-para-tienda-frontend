import React, { useMemo, useState } from "react";
import { Eye, Search, X } from "lucide-react";
import { cn } from "../../../../utils/cn.js";
import { formatCurrency } from "../../utils/currency.js";
import { tableHorizontalScrollClass } from "../../utils/modalResponsiveClasses.js";
import { 
  cierreFechaRaw, 
  cierreHistorialMontoPrincipal, 
  cierreHistorialTotalVentas, 
  cierreId 
} from "../../utils/caja.js";

/** Cabecera de tabla: clara y legible (evita la “barra negra” de bg-slate-900). */
const REPORT_THEAD =
  "border-b border-slate-200 bg-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-600";

/**
 * Contenedor dinámico que renderiza la tabla correcta según el tipo de reporte.
 */
export function ReportTables({
  activeReport,
  rows,
  summary,
  orders,
  currencySymbol,
  openOrderDetail,
  /** Anulación rápida desde la fila (solo reporte ventas) */
  onRequestCancelVenta,
  openCategoriaDetail,
  loading = false,
}) {
  if (loading) {
    return (
      <article className="rounded-2xl border border-slate-200 bg-white p-10 shadow-sm">
        <p className="text-center text-sm font-medium text-slate-500">Cargando datos del reporte…</p>
      </article>
    );
  }

  if (rows.length === 0 && orders.length === 0 && !summary) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
        <p className="text-sm font-bold text-slate-700 uppercase tracking-widest">
          Sin datos para el periodo seleccionado
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Prueba ampliando el rango de fechas o modificando el filtro.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Resumen de Ventas (Tarjetas superiores) */}
      {activeReport === "ventas" && summary && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <StatCard title="Total Ventas" value={formatCurrency(summary.totalVentas, currencySymbol)} />
          <StatCard title="Total Órdenes" value={summary.totalOrdenes} />
          <StatCard title="Promedio Ticket" value={formatCurrency(summary.promedioTicket, currencySymbol)} />
        </div>
      )}

      {activeReport === "vendedores" && summary && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <StatCard title="Total neto (período)" value={formatCurrency(summary.totalVentas, currencySymbol)} />
          <StatCard title="Tickets" value={summary.totalOrdenes} />
          <StatCard title="Promedio ticket" value={formatCurrency(summary.promedioTicket, currencySymbol)} />
        </div>
      )}

      {activeReport === "categorias" && summary && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <StatCard title="Categorías con venta" value={summary.totalCategorias ?? "—"} />
          <StatCard title="Total ventas (período)" value={formatCurrency(summary.totalVentas, currencySymbol)} />
          <StatCard title="Unidades vendidas" value={summary.totalUnidades ?? "—"} />
        </div>
      )}

      {/* Renderizado Condicional de Tablas */}
      <article className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-5">
        {activeReport === "productos-top" && <TopProductsTable rows={rows} currencySymbol={currencySymbol} />}
        {activeReport === "vendedores" && <VendedoresTable rows={rows} currencySymbol={currencySymbol} />}
        {activeReport === "categorias" && (
          <CategoriasTable rows={rows} currencySymbol={currencySymbol} openCategoriaDetail={openCategoriaDetail} />
        )}
        {activeReport === "caja" && <CajaTable rows={rows} currencySymbol={currencySymbol} />}
        {activeReport === "movimientos" && <MovimientosTable rows={rows} />}
        {activeReport === "ventas" && (
          <VentasTable
            orders={orders}
            currencySymbol={currencySymbol}
            openOrderDetail={openOrderDetail}
            onRequestCancelVenta={onRequestCancelVenta}
          />
        )}
      </article>
    </div>
  );
}

// --- SUB-COMPONENTES INTERNOS ---

function StatCard({ title, value }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{title}</p>
      <p className="mt-2 text-2xl font-black text-slate-900 tracking-tight">{value}</p>
    </article>
  );
}

function TopProductsTable({ rows, currencySymbol }) {
  return (
    <>
      <h4 className="mb-4 text-base font-bold text-slate-800 uppercase tracking-tight">Top Productos</h4>
      <div className={cn(tableHorizontalScrollClass)}>
        <table className="min-w-[520px] w-full text-left text-sm">
          <thead className={REPORT_THEAD}>
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3 text-center">Cantidad</th>
              <th className="px-4 py-3 text-right">Total Ventas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 italic font-medium">
            {rows.map((row, i) => (
              <tr key={i} className="hover:bg-slate-50/50">
                <td className="px-4 py-3 font-bold text-slate-400">#{i + 1}</td>
                <td className="px-4 py-3 font-bold text-slate-800 uppercase">{row.nombre || row.producto}</td>
                <td className="px-4 py-3 text-center font-black text-slate-600">{row.cantidad ?? row.unidades ?? 0}</td>
                <td className="px-4 py-3 text-right font-black text-blue-600">
                  {formatCurrency(row.venta ?? row.total ?? 0, currencySymbol)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function VendedoresTable({ rows, currencySymbol }) {
  return (
    <>
      <h4 className="mb-4 text-base font-bold text-slate-800 uppercase tracking-tight">Ventas por Vendedor</h4>
      <p className="mb-3 text-xs text-slate-500">
        Agrupado por usuario que registró el ticket en el POS (total neto alineado con otros reportes).
      </p>
      <div className={cn(tableHorizontalScrollClass)}>
        <table className="min-w-[640px] w-full text-left text-sm">
          <thead className={REPORT_THEAD}>
            <tr>
              <th className="px-4 py-3">Vendedor</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3 text-center">Tickets</th>
              <th className="px-4 py-3 text-right">Total neto</th>
              <th className="px-4 py-3 text-right">Prom. ticket</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {rows.map((row, i) => (
              <tr key={row.usuarioId != null ? `u-${row.usuarioId}` : i} className="hover:bg-slate-50/50">
                <td className="px-4 py-3 text-slate-800">
                  <span className="font-semibold">{row.vendedor}</span>
                  {row.nombreUsuario ? (
                    <span className="mt-0.5 block text-[11px] font-normal text-slate-500">
                      @{row.nombreUsuario}
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-xs text-slate-600 not-italic">{row.rol}</td>
                <td className="px-4 py-3 text-center font-semibold not-italic text-slate-700">
                  {row.cantidadTickets ?? "—"}
                </td>
                <td className="px-4 py-3 text-right font-black text-blue-600 not-italic">
                  {formatCurrency(row.totalNeto ?? 0, currencySymbol)}
                </td>
                <td className="px-4 py-3 text-right font-semibold not-italic text-slate-700">
                  {formatCurrency(row.promedioTicket ?? 0, currencySymbol)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function CategoriasTable({ rows, currencySymbol, openCategoriaDetail }) {
  return (
    <>
      <h4 className="mb-4 text-base font-bold text-slate-800 uppercase tracking-tight">Ventas por Categoría</h4>
      <p className="mb-3 text-xs text-slate-500">
        Una fila por categoría. En acciones, el ícono del ojo abre el detalle de productos de esa categoría.
      </p>
      <div className={cn(tableHorizontalScrollClass)}>
        <table className="min-w-[560px] w-full text-left text-sm">
          <thead className={REPORT_THEAD}>
            <tr>
              <th className="px-4 py-3">Categoría</th>
              <th className="px-4 py-3 text-center">Unidades</th>
              <th className="px-4 py-3 text-right">Total ventas</th>
              <th className="px-4 py-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium italic">
            {rows.map((cat, i) => (
              <tr key={`${cat.categoria}-${i}`} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-3 font-bold text-slate-800 uppercase not-italic">{cat.categoria}</td>
                <td className="px-4 py-3 text-center font-semibold not-italic text-slate-700">{cat.cantidad}</td>
                <td className="px-4 py-3 text-right font-black text-blue-600 not-italic">
                  {formatCurrency(cat.monto, currencySymbol)}
                </td>
                <td className="px-4 py-3 text-center not-italic">
                  <button
                    type="button"
                    onClick={() => openCategoriaDetail?.(cat)}
                    title="Ver detalle"
                    aria-label="Ver detalle de categoría"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function CajaTable({ rows, currencySymbol }) {
  return (
    <>
      <h4 className="mb-4 text-base font-bold text-slate-800 uppercase tracking-tight">Historial de Caja</h4>
      <div className={cn(tableHorizontalScrollClass)}>
        <table className="min-w-[640px] w-full text-left text-sm">
          <thead className={REPORT_THEAD}>
            <tr>
              <th className="px-4 py-3">Cierre</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Arqueo Real</th>
              <th className="px-4 py-3 text-right">Monto Ventas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium italic">
            {rows.map((row, i) => (
              <tr key={i} className="hover:bg-slate-50/50">
                <td className="px-4 py-3 font-bold text-slate-400">#{cierreId(row) ?? "-"}</td>
                <td className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase">{String(cierreFechaRaw(row) || "-").slice(0, 10)}</td>
                <td className="px-4 py-3">
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-black uppercase text-slate-600">
                        {row.estado || row.Estado || "-"}
                    </span>
                </td>
                <td className="px-4 py-3 text-right font-bold text-slate-700">
                  {formatCurrency(cierreHistorialMontoPrincipal(row), currencySymbol)}
                </td>
                <td className="px-4 py-3 text-right font-black text-blue-600">
                  {formatCurrency(cierreHistorialTotalVentas(row), currencySymbol)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function MovimientosTable({ rows }) {
  return (
    <>
      <h4 className="mb-4 text-base font-bold text-slate-800 uppercase tracking-tight">Movimientos de Inventario</h4>
      <div className={cn(tableHorizontalScrollClass)}>
        <table className="min-w-[640px] w-full text-left text-sm">
          <thead className={REPORT_THEAD}>
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3 text-right">Variación</th>
              <th className="px-4 py-3 text-right">Nueva Cant.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {rows.map((row, i) => {
              const variation = Number(row.cantidad || 0);
              return (
                <tr key={i} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase">
                    {String(row.fecha || row.createdAt || "").slice(0, 16).replace("T", " ")}
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-800 uppercase">
                    {row.productoNombre || row.producto?.nombre || `Item #${row.productoId}`}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
                      String(row.tipo).toLowerCase().includes("entrada") ? "bg-green-100 text-green-700" :
                      String(row.tipo).toLowerCase().includes("salida") ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                    }`}>
                      {row.tipo || row.subtipo}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-right font-black ${variation > 0 ? "text-green-600" : "text-red-600"}`}>
                    {variation > 0 ? "+" : ""}{variation}
                  </td>
                  <td className="px-4 py-3 text-right font-black text-slate-900">
                    {row.cantidadNueva ?? "-"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

function VentasTable({ orders, currencySymbol, openOrderDetail, onRequestCancelVenta }) {
  const [ticketSearch, setTicketSearch] = useState("");

  const filteredOrders = useMemo(() => {
    const q = String(ticketSearch || "").trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((o) => {
      const num = String(o.numero ?? "").toLowerCase();
      const idStr = o.sourceId != null ? String(o.sourceId) : "";
      return num.includes(q) || idStr.includes(q);
    });
  }, [orders, ticketSearch]);

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h4 className="text-base font-bold text-slate-800 uppercase tracking-tight">
            Ventas / tickets del período
          </h4>
          <p className="mt-1 text-xs text-slate-500">
            Filtro «Tickets» arriba. El ojo es el detalle. <strong>Cancelar</strong> (X) solo en cobrados; pide el código que
            configuraste en Ajustes.
          </p>
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={ticketSearch}
            onChange={(e) => setTicketSearch(e.target.value)}
            placeholder="Buscar por ticket…"
            autoComplete="off"
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-base shadow-sm placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 sm:py-2 sm:text-sm"
            aria-label="Buscar por número de ticket"
          />
        </div>
      </div>

      {orders.length > 0 && filteredOrders.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
          No hay tickets que coincidan con «{ticketSearch.trim()}». Prueba otro número o borra el filtro.
        </p>
      ) : (
        <div className={cn(tableHorizontalScrollClass)}>
          <table className="min-w-[920px] w-full text-left text-sm">
            <thead className={REPORT_THEAD}>
              <tr>
                <th className="px-4 py-3">Ticket</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Cliente / ref.</th>
                <th className="px-4 py-3 text-center">Productos</th>
                <th className="px-4 py-3 text-right">Subtotal</th>
                <th className="px-4 py-3 text-right">Total neto</th>
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium italic">
              {filteredOrders.map((o) => {
                const est = String(o.estado || "").toLowerCase();
                const esAnulada = est.includes("anulad");
                return (
                <tr key={o.key} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 font-bold text-slate-800 uppercase">{String(o.numero)}</td>
                  <td className="px-4 py-3 not-italic">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
                        esAnulada ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {o.estado}
                    </span>
                    {o.fechaUltimaActualizacion ? (
                      <div className="mt-0.5 text-[10px] font-normal normal-case text-slate-500">
                        Act. {String(o.fechaUltimaActualizacion).slice(0, 16).replace("T", " ")}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase">
                    {String(o.fecha || "").slice(0, 10)}
                  </td>
                  <td className="px-4 py-3 not-italic">{o.referencia}</td>
                  <td className="px-4 py-3 text-center font-semibold not-italic text-slate-700">
                    {o.cantidadLineas != null ? o.cantidadLineas : "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold not-italic text-slate-700">
                    {o.subtotalLineas != null ? formatCurrency(o.subtotalLineas, currencySymbol) : "—"}
                  </td>
                  <td className={`px-4 py-3 text-right font-black not-italic ${esAnulada ? "text-slate-600" : "text-blue-600"}`}>
                    {formatCurrency(o.monto, currencySymbol)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => openOrderDetail(o)}
                        title="Ver detalle del ticket"
                        aria-label="Ver detalle del ticket"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {!esAnulada ? (
                        <button
                          type="button"
                          onClick={() => onRequestCancelVenta?.(o)}
                          title="Cancelar venta (código de Ajustes)"
                          aria-label="Cancelar venta"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-white text-red-700 shadow-sm transition-colors hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
