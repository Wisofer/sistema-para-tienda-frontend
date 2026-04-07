import React from "react";

/**
 * Filtros de fechas y acciones para los reportes detallados.
 */
export function ReportFilters({
  activeReport,
  setActiveReport,
  range,
  setRange,
  loadReportData,
  downloadExcel,
  exporting,
  setRows,
  setSummary,
}) {
  const getTitle = () => {
    switch (activeReport) {
      case "ventas":
        return `Reporte de Ventas - ${new Date().toLocaleDateString("es-NI")}`;
      case "productos-top":
        return "Reporte de Productos Más Vendidos";
      case "vendedores":
        return "Reporte de Ventas por Vendedor";
      case "categorias":
        return "Reporte de Ventas por Categoría";
      case "movimientos":
        return "Reporte de Movimientos de Inventario";
      case "caja":
        return "Reporte de Historial de Caja";
      default:
        return "Detalle del Reporte";
    }
  };

  return (
    <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900 sm:text-lg">
            {getTitle()}
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Ajusta el rango de fechas y actualiza los datos o exporta a Excel.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setActiveReport(null);
            setRows([]);
            setSummary(null);
          }}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Volver al catálogo
        </button>
      </div>

      <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-6">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Desde
          </label>
          <input
            type="date"
            value={range.desde}
            onChange={(e) => setRange((r) => ({ ...r, desde: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Hasta
          </label>
          <input
            type="date"
            value={range.hasta}
            onChange={(e) => setRange((r) => ({ ...r, hasta: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
          />
        </div>

        {activeReport === "productos-top" && (
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Top productos
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={range.top}
              onChange={(e) => setRange((r) => ({ ...r, top: Number(e.target.value || 10) }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
            />
          </div>
        )}

        {activeReport === "ventas" && (
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Tickets
            </label>
            <select
              value={range.filtroVentas ?? "activas"}
              onChange={(e) =>
                setRange((r) => ({ ...r, filtroVentas: e.target.value || "activas" }))
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
              aria-label="Filtrar ventas por estado"
            >
              <option value="activas">Solo cobradas</option>
              <option value="anuladas">Solo anuladas</option>
              <option value="todas">Cobradas y anuladas</option>
            </select>
          </div>
        )}

        <div className="flex min-w-0 flex-col gap-2 sm:flex-row md:col-span-2">
          <button
            type="button"
            onClick={() => loadReportData(activeReport)}
            className="min-h-[44px] flex-1 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 sm:min-h-0"
          >
            Aplicar filtros
          </button>
          <button
            type="button"
            onClick={() => downloadExcel(activeReport)}
            disabled={exporting}
            className="min-h-[44px] flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60 sm:min-h-0"
          >
            {exporting ? "Exportando…" : "Exportar Excel"}
          </button>
        </div>
      </div>
    </article>
  );
}
