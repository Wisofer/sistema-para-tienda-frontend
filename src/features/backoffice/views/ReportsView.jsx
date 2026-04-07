import React from "react";

// Hook personalizado
import { useReports } from "../hooks/useReports.js";

// Componentes modulares
import { ReportCatalog } from "../components/reports/ReportCatalog.jsx";
import { ReportFilters } from "../components/reports/ReportFilters.jsx";
import { ReportTables } from "../components/reports/ReportTables.jsx";
import { OrderDetailModal } from "../components/reports/OrderDetailModal.jsx";
import { CategoriaProductosModal } from "../components/reports/CategoriaProductosModal.jsx";
import { BackofficePageShell } from "../components/index.js";

/**
 * Vista principal de Reportes (Refactorizada).
 * Ahora actúa como un orquestador que utiliza el hook useReports 
 * y componentes especializados para cumplir con las reglas de Clean Code.
 * 
 * Lineas aproximadas: < 100 (Reducción de ~800 líneas).
 */
export function ReportsView({ currencySymbol = "C$" }) {
  const {
    activeReport,
    setActiveReport,
    range,
    setRange,
    rows,
    summary,
    orders,
    loading,
    exporting,
    error,
    loadReportData,
    downloadExcel,
    detailOpen,
    setDetailOpen,
    detailLoading,
    detailOrder,
    openOrderDetail,
    categoriaDetailOpen,
    setCategoriaDetailOpen,
    categoriaDetailRow,
    setCategoriaDetailRow,
    openCategoriaDetail,
  } = useReports(currencySymbol);

  return (
    <BackofficePageShell maxWidth="7xl" className="space-y-5">
      {/* Mensaje de Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* 1. Catálogo de Reportes (Si no hay ninguno seleccionado) */}
      {!activeReport && (
        <ReportCatalog setActiveReport={setActiveReport} />
      )}

      {/* 2. Detalle del Reporte Seleccionado */}
      {activeReport && (
        <>
          {/* Filtros y Acciones */}
          <ReportFilters
            activeReport={activeReport}
            setActiveReport={setActiveReport}
            range={range}
            setRange={setRange}
            loadReportData={loadReportData}
            downloadExcel={downloadExcel}
            exporting={exporting}
            setRows={() => {}} // dummy para compatibilidad si fuera necesario
            setSummary={() => {}}
          />

          {/* Visualización de Datos (carga inline en tablas, sin pantalla solo-skeleton) */}
          <ReportTables
            activeReport={activeReport}
            rows={rows}
            summary={summary}
            orders={orders}
            currencySymbol={currencySymbol}
            openOrderDetail={openOrderDetail}
            openCategoriaDetail={openCategoriaDetail}
            loading={loading}
          />
        </>
      )}

      {/* --- MODALES --- */}

      {/* Detalle de Factura/Orden */}
      <OrderDetailModal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        loading={detailLoading}
        order={detailOrder}
        currencySymbol={currencySymbol}
      />

      <CategoriaProductosModal
        open={categoriaDetailOpen}
        onClose={() => {
          setCategoriaDetailOpen(false);
          setCategoriaDetailRow(null);
        }}
        categoriaRow={categoriaDetailRow}
        currencySymbol={currencySymbol}
      />
    </BackofficePageShell>
  );
}
