import React from "react";
import {
  Download,
  History,
  LayoutGrid,
  PackageMinus,
  PackagePlus,
  Plus,
  Search,
  SlidersHorizontal,
  Tags,
} from "lucide-react";

/**
 * Encabezado del módulo de Inventario con búsqueda, filtros y acciones.
 */
export function InventoryHeader({
  search,
  setSearch,
  selectedCategory,
  onCategoryChange,
  categories,
  openCreate,
  openStockModal,
  openGlobalMovements,
  exportProductsExcel,
  setCategoriesScreen,
  saving,
  gridColumns,
  setGridColumns,
  readOnly = false,
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4">
        {/* Fila 1: Búsqueda y categoría */}
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre o código..."
                className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-4 text-sm sm:w-64 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <select
              value={selectedCategory != null && selectedCategory !== "" ? String(selectedCategory) : ""}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm sm:w-auto focus:border-blue-500 focus:outline-none"
            >
              <option value="">Todas las categorías</option>
              {categories.map((c) => (
                <option key={c.id} value={String(c.id ?? c.Id ?? "")}>
                  {c.nombre || c.descripcion || `Categoría ${c.id}`}
                </option>
              ))}
            </select>
          </div>
          {!readOnly && (
            <button
              onClick={openCreate}
              className="inline-flex items-center justify-center gap-1 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition-all active:scale-[0.98]"
            >
              <Plus className="h-5 w-5" />
              NUEVO PRODUCTO
            </button>
          )}
        </div>

        {/* Fila 2: Acciones secundarias y Selector de Grid */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap gap-2">
            {!readOnly && (
              <>
            <button
              type="button"
              onClick={() => openStockModal("entrada")}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-all"
            >
              <PackagePlus className="h-4.5 w-4.5 shrink-0" />
              ENTRADA
            </button>
            <button
              type="button"
              onClick={() => openStockModal("salida")}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-rose-600 px-3 py-2 text-xs font-bold text-white hover:bg-rose-700 transition-all"
            >
              <PackageMinus className="h-4.5 w-4.5 shrink-0" />
              SALIDA
            </button>
            <button
              type="button"
              onClick={() => openStockModal("ajuste")}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-white hover:bg-amber-600 transition-all"
            >
              <SlidersHorizontal className="h-4.5 w-4.5 shrink-0" />
              AJUSTE
            </button>
            <button
              type="button"
              onClick={openGlobalMovements}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition-all"
            >
              <History className="h-4.5 w-4.5 shrink-0" />
              MOVIMIENTOS
            </button>
            <button
              type="button"
              onClick={exportProductsExcel}
              disabled={saving}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-60 transition-all"
            >
              <Download className="h-4.5 w-4.5 shrink-0" />
              EXPORTAR
            </button>
            <button
              type="button"
              onClick={() => setCategoriesScreen(true)}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-purple-600 px-3 py-2 text-xs font-bold text-white hover:bg-purple-700 transition-all"
            >
              <Tags className="h-4.5 w-4.5 shrink-0" />
              CATEGORÍAS
            </button>
              </>
            )}
          </div>

          {/* Selector de Columnas (Grid Density) */}
          <div className="hidden items-center gap-1 rounded-xl bg-slate-100 p-1 lg:flex">
            {[3, 4, 5, 6].map((num) => (
              <button
                key={num}
                onClick={() => setGridColumns(num)}
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-black transition-all ${
                  gridColumns === num
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-400 hover:text-slate-600"
                }`}
                title={`${num} columnas`}
              >
                {num}
              </button>
            ))}
            <div className="mx-1 h-4 w-px bg-slate-200" />
            <LayoutGrid className="h-4 w-4 text-slate-400" />
          </div>
        </div>
      </div>
    </div>
  );
}
