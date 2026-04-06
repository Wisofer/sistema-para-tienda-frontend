import React from "react";
import { Search, Barcode } from "lucide-react";

/**
 * Encabezado del POS con búsqueda y filtros de categoría.
 */
export function PosHeader({
  search,
  setSearch,
  categories,
  selectedCategory,
  setSelectedCategory,
}) {
  return (
    <div className="sticky top-0 z-10 border-b border-slate-100 bg-white/80 p-4 backdrop-blur-md">
      <div className="flex flex-col gap-3">
        {/* Barra de Búsqueda */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-10 text-sm focus:border-blue-500 focus:bg-white focus:outline-none transition-all"
          />
          <Barcode className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-300 pointer-events-none" />
        </div>

        {/* Filtros de Categoría */}
        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory("")}
            className={`whitespace-nowrap rounded-lg px-4 py-1.5 text-xs font-black uppercase tracking-widest transition-all ${
              !selectedCategory
                ? "bg-slate-900 text-white shadow-lg shadow-slate-200"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
          >
            Todos
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(String(cat.id))}
              className={`whitespace-nowrap rounded-lg px-4 py-1.5 text-xs font-black uppercase tracking-widest transition-all ${
                selectedCategory === String(cat.id)
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-100"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              {cat.nombre}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
