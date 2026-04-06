import React from "react";
import { BackofficeStatCardsListSkeleton } from "../components/index.js";

// Hook personalizado
import { useReports } from "../hooks/useReports.js";

// Componentes modulares
import { ReportCatalog } from "../components/reports/ReportCatalog.jsx";
import { ReportFilters } from "../components/reports/ReportFilters.jsx";
import { ReportTables } from "../components/reports/ReportTables.jsx";
import { OrderDetailModal } from "../components/reports/OrderDetailModal.jsx";

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
    openOrderDetail
  } = useReports(currencySymbol);

  // Pantalla de carga inicial del reporte seleccionado
  const showSkeleton = loading && rows.length === 0 && orders.length === 0;

  return (
    <div className="mx-auto min-w-0 max-w-full space-y-4">
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

          {/* Visualización de Datos */}
          {showSkeleton ? (
            <div className="pt-4">
                <BackofficeStatCardsListSkeleton listRows={5} />
            </div>
          ) : (
            <ReportTables
              activeReport={activeReport}
              rows={rows}
              summary={summary}
              orders={orders}
              currencySymbol={currencySymbol}
              openOrderDetail={openOrderDetail}
            />
          )}
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
    </div>
  );
}
