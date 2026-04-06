import React from "react";
import { ArrowRight } from "lucide-react";
import { reportCards } from "../../utils/reportUtils.js";

/**
 * Catálogo de reportes disponibles (Dashboard de selección).
 * Rediseñado para una estética minimalista y profesional.
 */
export function ReportCatalog({ setActiveReport }) {
  return (
    <div className="mx-auto max-w-6xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Cabecera del Catálogo */}
      <div className="text-center sm:text-left">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight sm:text-3xl">
          Catálogo de Reportes
        </h2>
        <p className="mt-2 text-sm font-medium text-slate-500">
          Analiza el rendimiento de tu negocio con métricas precisas y exportación de datos.
        </p>
      </div>

      {/* Grid de Tarjetas */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {reportCards.map((card) => (
          <button
            key={card.id}
            onClick={() => setActiveReport(card.id)}
            className="group relative flex flex-col items-start rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-all duration-300 hover:border-primary-200 hover:shadow-xl hover:shadow-primary-50/50 active:scale-[0.98]"
          >
            {/* Indicador de Color (Sutil) */}
            <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl ${card.color.replace('text-', 'bg-').split(' ')[0]} bg-opacity-10 transition-transform duration-500 group-hover:rotate-3 group-hover:scale-110`}>
              <card.icon className={`h-7 w-7 ${card.color.split(' ')[1]}`} />
            </div>

            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              {card.title}
            </h3>
            
            <p className="mt-2 mb-8 text-sm font-medium leading-relaxed text-slate-500">
              {card.description}
            </p>

            <div className="mt-auto flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-900 opacity-80 group-hover:opacity-100 group-hover:text-primary-600 transition-all">
              <span>{card.button}</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </div>

            {/* Efecto de Brillo Sutil en Hover */}
            <div className="absolute inset-0 rounded-3xl bg-primary-500/0 transition-colors group-hover:bg-primary-500/[0.02]" />
          </button>
        ))}
      </div>
    </div>
  );
}
