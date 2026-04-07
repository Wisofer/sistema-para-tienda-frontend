import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Resumen + paginación del listado de inventario (texto orientado al usuario final).
 */
export function InventoryListFooter({
  page,
  pageSize,
  totalPages,
  totalCount,
  itemsOnPage,
  onPageChange,
  loading,
}) {
  const safePage = Math.max(1, page || 1);
  const safeTotalPages = Math.max(1, totalPages || 1);
  const from = itemsOnPage === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = itemsOnPage === 0 ? 0 : (safePage - 1) * pageSize + itemsOnPage;

  let summary;
  if (itemsOnPage === 0) {
    summary = "Sin productos en esta página.";
  } else if (totalCount != null) {
    summary = (
      <>
        Mostrando{" "}
        <strong className="tabular-nums text-slate-800">
          {from}–{to}
        </strong>{" "}
        de{" "}
        <strong className="text-slate-800">{totalCount}</strong> productos
      </>
    );
  } else {
    summary = (
      <>
        Mostrando{" "}
        <strong className="tabular-nums text-slate-800">
          {from}–{to}
        </strong>
      </>
    );
  }

  const canPrev = safePage > 1 && !loading;
  const canNext = safePage < safeTotalPages && !loading;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-600">{summary}</p>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs tabular-nums text-slate-500">
          Página {safePage} / {safeTotalPages}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={!canPrev}
            onClick={() => onPageChange(safePage - 1)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-40"
            aria-label="Página anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            disabled={!canNext}
            onClick={() => onPageChange(safePage + 1)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-40"
            aria-label="Página siguiente"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
