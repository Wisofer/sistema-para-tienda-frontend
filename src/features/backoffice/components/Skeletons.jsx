import { cn } from "../../../utils/cn.js";

function pulse(className) {
  return `animate-pulse rounded-lg bg-slate-200/80 ${className}`;
}

export function StatCardsSkeleton() {
  return (
    <div className="grid w-full min-w-0 grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className={pulse("h-4 w-28")} />
          <div className={pulse("mt-3 h-8 w-24")} />
          <div className={pulse("mt-2 h-4 w-42")} />
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton({ rows = 6 }) {
  return (
    <div className="w-full min-w-0 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className={pulse("mb-4 h-6 w-full max-w-xs")} />
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="rounded-xl border border-slate-200 p-4">
            <div className={pulse("h-4 w-full")} />
            <div className={pulse("mt-2 h-3 w-full opacity-90")} />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Contenedor del área principal del backoffice.
 * `maxWidth`: alinear con la vista real (fluid = todo el ancho del panel; 7xl = dashboard; 3xl = caja).
 */
const PAGE_MAX_WIDTH = {
  full: "max-w-full",
  "3xl": "mx-auto max-w-3xl",
  "4xl": "mx-auto max-w-4xl",
  "5xl": "mx-auto max-w-5xl",
  "6xl": "mx-auto max-w-6xl",
  "7xl": "mx-auto max-w-7xl",
};

export function BackofficePageShell({ children, className, maxWidth = "full" }) {
  const widthCl = PAGE_MAX_WIDTH[maxWidth] ?? PAGE_MAX_WIDTH.full;
  return <div className={cn("w-full min-w-0", widthCl, className)}>{children}</div>;
}

/** Lista única (carga inicial de vistas sin tarjetas KPI). */
export function BackofficeListSkeletonLoading({ rows = 6, maxWidth = "full" }) {
  return (
    <BackofficePageShell maxWidth={maxWidth}>
      <ListSkeleton rows={rows} />
    </BackofficePageShell>
  );
}

/** KPIs + lista (dashboard, productos, mesas). */
export function BackofficeStatCardsListSkeleton({ listRows = 4, maxWidth = "full" }) {
  return (
    <BackofficePageShell maxWidth={maxWidth} className="space-y-4">
      <StatCardsSkeleton />
      <ListSkeleton rows={listRows} />
    </BackofficePageShell>
  );
}
