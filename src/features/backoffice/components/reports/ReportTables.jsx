import React from "react";
import { formatCurrency } from "../../utils/currency.js";
import { 
  cierreFechaRaw, 
  cierreHistorialMontoPrincipal, 
  cierreHistorialTotalVentas, 
  cierreId 
} from "../../utils/caja.js";
import { categoriaReporteNombre } from "../../utils/reportUtils.js";

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
}) {
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

      {/* Renderizado Condicional de Tablas */}
      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm overflow-hidden">
        {activeReport === "productos-top" && <TopProductsTable rows={rows} currencySymbol={currencySymbol} />}
        {activeReport === "vendedores" && <VendedoresTable rows={rows} currencySymbol={currencySymbol} />}
        {activeReport === "categorias" && <CategoriasTable rows={rows} currencySymbol={currencySymbol} />}
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
          <thead className="bg-slate-900 text-[10px] font-black uppercase tracking-widest text-slate-400">
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
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <tr>
              <th className="px-4 py-3">Vendedor</th>
              <th className="px-4 py-3 text-center">Órdenes</th>
              <th className="px-4 py-3 text-right">Total Ventas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {rows.map((row, i) => (
              <tr key={i} className="hover:bg-slate-50/50">
                <td className="px-4 py-3 font-bold text-slate-800 uppercase">{row.vendedor}</td>
                <td className="px-4 py-3 text-center font-black text-slate-600">{row.ordenes}</td>
                <td className="px-4 py-3 text-right font-black text-blue-600">
                  {formatCurrency(row.venta ?? 0, currencySymbol)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function CategoriasTable({ rows, currencySymbol }) {
  return (
    <>
      <h4 className="mb-4 text-base font-bold text-slate-800 uppercase tracking-tight">Ventas por Categoría</h4>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <tr>
              <th className="px-4 py-3">Categoría</th>
              <th className="px-4 py-3 text-center">Items Vendidos</th>
              <th className="px-4 py-3 text-right">Total Ventas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {rows.map((row, i) => (
              <tr key={i} className="hover:bg-slate-50/50">
                <td className="px-4 py-3 font-bold text-slate-800 uppercase">{categoriaReporteNombre(row, i)}</td>
                <td className="px-4 py-3 text-center font-black text-slate-600">{row.cantidad ?? row.totalArticulos ?? 0}</td>
                <td className="px-4 py-3 text-right font-black text-blue-600">
                  {formatCurrency(row.total ?? row.venta ?? 0, currencySymbol)}
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
          <thead className="bg-slate-900 text-[10px] font-black uppercase tracking-widest text-slate-400">
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
          <thead className="bg-slate-900 text-[10px] font-black uppercase tracking-widest text-slate-400">
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
      <h4 className="mb-4 text-base font-bold text-slate-800 uppercase tracking-tight">Órdenes del Período</h4>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <tr>
              <th className="px-4 py-3">Número</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Referencia</th>
              <th className="px-4 py-3 text-right">Monto</th>
              <th className="px-4 py-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium italic">
            {orders.map((o) => (
              <tr key={o.key} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-3 font-bold text-slate-800 uppercase">#{o.numero}</td>
                <td className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase">
                  {String(o.fecha).slice(0, 10)}
                </td>
                <td className="px-4 py-3">{o.referencia}</td>
                <td className="px-4 py-3 text-right font-black text-blue-600">
                  {formatCurrency(o.monto, currencySymbol)}
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => openOrderDetail(o)}
                    className="rounded-lg bg-blue-50 px-3 py-1 text-[10px] font-black uppercase text-blue-600 hover:bg-blue-100 transition-colors"
                  >
                    Ver Detalle
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
