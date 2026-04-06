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
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight">
            {getTitle()}
          </h3>
          <p className="text-sm text-slate-500">
            Filtra por rango de fechas para consultar resultados.
          </p>
        </div>
        <button
          onClick={() => {
            setActiveReport(null);
            setRows([]);
            setSummary(null);
          }}
          className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
        >
          VOLVER AL CATÁLOGO
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-6 items-end">
        <div>
          <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">
            Desde
          </label>
          <input
            type="date"
            value={range.desde}
            onChange={(e) => setRange((r) => ({ ...r, desde: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">
            Hasta
          </label>
          <input
            type="date"
            value={range.hasta}
            onChange={(e) => setRange((r) => ({ ...r, hasta: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        {activeReport === "productos-top" && (
          <div>
            <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">
              Top
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={range.top}
              onChange={(e) => setRange((r) => ({ ...r, top: Number(e.target.value || 10) }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
        )}

        <div className="md:col-span-2 flex gap-2">
          <button
            onClick={() => loadReportData(activeReport)}
            className="flex-1 rounded-xl bg-slate-900 px-4 py-3 text-xs font-bold text-white shadow-lg shadow-slate-200 hover:bg-black transition-all active:scale-[0.98]"
          >
            FILTRAR
          </button>
          <button
            onClick={() => downloadExcel(activeReport)}
            disabled={exporting}
            className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-100 hover:bg-emerald-700 disabled:opacity-60 transition-all active:scale-[0.98]"
          >
            {exporting ? "EXPORTANDO..." : "EXPORTAR EXCEL"}
          </button>
        </div>
      </div>
    </article>
  );
}
