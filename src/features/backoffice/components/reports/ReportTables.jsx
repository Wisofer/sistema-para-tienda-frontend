import React from "react";
import { formatCurrency } from "../../utils/currency.js";
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
      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm overflow-hidden">
        {activeReport === "productos-top" && <TopProductsTable rows={rows} currencySymbol={currencySymbol} />}
        {activeReport === "vendedores" && <VendedoresTable rows={rows} currencySymbol={currencySymbol} />}
        {activeReport === "categorias" && (
          <CategoriasTable rows={rows} currencySymbol={currencySymbol} openCategoriaDetail={openCategoriaDetail} />
        )}
        {activeReport === "caja" && <CajaTable rows={rows} currencySymbol={currencySymbol} />}
        {activeReport === "movimientos" && <MovimientosTable rows={rows} />}
        {activeReport === "ventas" && <VentasTable orders={orders} currencySymbol={currencySymbol} openOrderDetail={openOrderDetail} />}
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
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
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
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
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
        Una fila por categoría. Use “Ver detalle” para ver los productos vendidos en esa categoría.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
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
                    className="rounded-lg bg-blue-50 px-3 py-1 text-[10px] font-black uppercase text-blue-600 transition-colors hover:bg-blue-100"
                  >
                    Ver detalle
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
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
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
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
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

function VentasTable({ orders, currencySymbol, openOrderDetail }) {
  return (
    <>
      <h4 className="mb-4 text-base font-bold text-slate-800 uppercase tracking-tight">
        Ventas / tickets del período
      </h4>
      <p className="mb-3 text-xs text-slate-500">
        Una fila por venta cobrada. Use “Ver detalle” para ver todas las líneas del ticket.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className={REPORT_THEAD}>
            <tr>
              <th className="px-4 py-3">Ticket</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Cliente / ref.</th>
              <th className="px-4 py-3 text-center">Productos</th>
              <th className="px-4 py-3 text-right">Subtotal</th>
              <th className="px-4 py-3 text-right">Total cobrado</th>
              <th className="px-4 py-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium italic">
            {orders.map((o) => (
              <tr key={o.key} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-3 font-bold text-slate-800 uppercase">{String(o.numero)}</td>
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
                <td className="px-4 py-3 text-right font-black text-blue-600 not-italic">
                  {formatCurrency(o.monto, currencySymbol)}
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    type="button"
                    onClick={() => openOrderDetail(o)}
                    className="rounded-lg bg-blue-50 px-3 py-1 text-[10px] font-black uppercase text-blue-600 hover:bg-blue-100 transition-colors"
                  >
                    Ver detalle
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
