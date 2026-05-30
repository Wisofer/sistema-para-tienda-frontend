import {
  TrendingUp,
  ShoppingCart,
  Wallet,
  Target,
  Calendar,
  Package,
  AlertTriangle,
  Award,
  BarChart2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { backofficeApi } from "../services/backofficeApi.js";
import { BackofficePageShell, BackofficeStatCardsListSkeleton } from "../components/index.js";
import { formatCurrency } from "../utils/currency.js";
import { dashboardTransaccionesHoy } from "../utils/dashboardResumen.js";

const TOP_PRODUCTS_LIMIT = 3;


/** Tonos azul para categorías */
const CAT_COLORS = [
  { bar: "#3b82f6", bg: "#eff6ff", text: "#1d4ed8" },
  { bar: "#0ea5e9", bg: "#f0f9ff", text: "#0369a1" },
  { bar: "#6366f1", bg: "#eef2ff", text: "#4338ca" },
  { bar: "#8b5cf6", bg: "#f5f3ff", text: "#6d28d9" },
];

function parseSeriesDate(rawDate) {
  if (!rawDate) return null;
  const asString = String(rawDate).trim();
  const direct = new Date(asString);
  if (!Number.isNaN(direct.getTime())) return direct;
  const ymd = asString.match(/^(\d{4})-(\d{2})$/);
  if (ymd) return new Date(Number(ymd[1]), Number(ymd[2]) - 1, 1);
  const my = asString.match(/^(\d{2})\/(\d{4})$/);
  if (my) return new Date(Number(my[2]), Number(my[1]) - 1, 1);
  return null;
}

function formatYAxis(value) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return String(value);
}

function ChartTooltip({ active, payload, label, currencySymbol }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div
      style={{
        background: "white",
        border: "1px solid #e2e8f0",
        borderRadius: "10px",
        padding: "10px 14px",
        boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
        fontSize: "13px",
      }}
    >
      <p style={{ fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>{label}</p>
      <p style={{ color: "#3b82f6", fontWeight: 600 }}>
        {formatCurrency(Number(payload[0]?.value || 0), currencySymbol)}
      </p>
    </div>
  );
}

export function DashboardView({ currencySymbol = "C$" }) {
  const [loading, setLoading] = useState(true);
  const [topProducts, setTopProducts] = useState([]);
  const [salesSeries, setSalesSeries] = useState([]);
  const [salesByCategory, setSalesByCategory] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [rangeLabel, setRangeLabel] = useState("");
  const [kpis, setKpis] = useState({
    ventasHoy: 0,
    ingresos: 0,
    ticketPromedio: 0,
    ventasMes: 0,
    ventasSemana: 0,
    totalHistorico: 0,
  });

  useEffect(() => {
    let mounted = true;
    backofficeApi
      .dashboardResumen({ topProductos: TOP_PRODUCTS_LIMIT })
      .then((dashboard) => {
        if (!mounted) return;
        const kpisRaw = dashboard?.kpis || {};
        const topItems = dashboard?.topProductos || [];
        const serieItems = dashboard?.serieVentas || [];
        const categoriasItems = dashboard?.ventasPorCategoria || kpisRaw?.ventasPorCategoria || [];
        const lowStockItems = dashboard?.productosStockBajoLista || [];
        const rango = dashboard?.rango || {};

        const totalVentasValor = kpisRaw?.totalVentasHoy ?? dashboard?.totalVentasHoy ?? 0;
        const ticketPromedio = kpisRaw?.ticketPromedioHoy ?? dashboard?.ticketPromedioHoy ?? 0;
        const ventasHoy = dashboardTransaccionesHoy(dashboard);
        const ventasMes = kpisRaw?.ventasMes ?? dashboard?.ventasMes ?? 0;
        const ventasSemana = kpisRaw?.ventasSemana ?? dashboard?.ventasSemana ?? 0;

        const desdeLabel = String(rango?.desde || "").slice(0, 10);
        const hastaLabel = String(rango?.hasta || "").slice(0, 10);
        setRangeLabel(desdeLabel && hastaLabel ? `${desdeLabel} — ${hastaLabel}` : "Período actual");

        setTopProducts(
          topItems.slice(0, TOP_PRODUCTS_LIMIT).map((x, i) => ({
            name: x.producto || x.nombre || "Producto",
            sold: x.cantidad || 0,
            amount: x.venta || x.total || 0,
            rank: i + 1,
          }))
        );

        setSalesByCategory(
          categoriasItems.slice(0, 4).map((c) => ({
            name: c.nombreCategoria || "Categoría",
            total: c.total || 0,
          }))
        );

        setLowStockProducts(
          lowStockItems.slice(0, 4).map((p) => ({
            name: p.nombre || "Producto",
            stock: p.stock ?? 0,
            min: p.stockMinimo ?? 0,
          }))
        );

        const byMonth = new Map();
        serieItems.forEach((s) => {
          const rawDate = s?.fecha || s?.dia || s?.label || s?.mes;
          const value = Number(s?.monto || s?.totalVentas || s?.total || s?.ventas || 0);
          if (!rawDate) return;
          const parsed = parseSeriesDate(rawDate);
          if (!parsed) return;
          const key = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}`;
          byMonth.set(key, (byMonth.get(key) || 0) + value);
        });

        let monthlySeries = Array.from(byMonth.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([key, total]) => {
            const [year, month] = key.split("-");
            const date = new Date(Number(year), Number(month) - 1, 1);
            return {
              key,
              name: date.toLocaleString("es-NI", { month: "short" }).replace(".", ""),
              total,
            };
          });

        if (monthlySeries.length === 0 && Number(ventasMes) > 0) {
          const current = new Date();
          monthlySeries = [
            {
              key: `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}`,
              name: current.toLocaleString("es-NI", { month: "short" }).replace(".", ""),
              total: Number(ventasMes),
            },
          ];
        }

        setSalesSeries(monthlySeries);

        const totalHistorico = monthlySeries.reduce((sum, p) => sum + Number(p.total || 0), 0);

        setKpis({
          ventasHoy: Number(ventasHoy),
          ingresos: Number(totalVentasValor),
          ticketPromedio: Number(ticketPromedio),
          ventasMes: Number(ventasMes),
          ventasSemana: Number(ventasSemana),
          totalHistorico,
        });
      })
      .catch(() => {
        if (!mounted) return;
        setKpis({ ventasHoy: 0, ingresos: 0, ticketPromedio: 0, ventasMes: 0, ventasSemana: 0, totalHistorico: 0 });
        setSalesSeries([]);
        setSalesByCategory([]);
        setLowStockProducts([]);
        setRangeLabel("Sin datos");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, [currencySymbol]);

  const safeProducts = useMemo(() => topProducts.slice(0, TOP_PRODUCTS_LIMIT), [topProducts]);
  const maxCategoryTotal = useMemo(
    () => Math.max(...salesByCategory.map((c) => c.total), 1),
    [salesByCategory]
  );
  const maxProductSold = useMemo(
    () => Math.max(...safeProducts.map((p) => p.sold), 1),
    [safeProducts]
  );

  if (loading) {
    return <BackofficeStatCardsListSkeleton listRows={4} maxWidth="7xl" />;
  }

  const kpiCards = [
    {
      id: "ventas-hoy",
      label: "Ventas de Hoy",
      value: String(kpis.ventasHoy),
      sub: "transacciones realizadas",
      icon: ShoppingCart,
      iconColor: "#3b82f6",
      iconBg: "#eff6ff",
      accent: "#3b82f6",
    },
    {
      id: "ingresos",
      label: "Ingresos del Día",
      value: formatCurrency(kpis.ingresos, currencySymbol),
      sub: "efectivo total en caja",
      icon: Wallet,
      iconColor: "#0ea5e9",
      iconBg: "#f0f9ff",
      accent: "#0ea5e9",
    },
    {
      id: "ticket-promedio",
      label: "Ticket Promedio",
      value: formatCurrency(kpis.ticketPromedio, currencySymbol),
      sub: "valor medio por cliente",
      icon: Target,
      iconColor: "#6366f1",
      iconBg: "#eef2ff",
      accent: "#6366f1",
    },
    {
      id: "ventas-mes",
      label: "Ventas del Mes",
      value: formatCurrency(kpis.ventasMes, currencySymbol),
      sub: "acumulado mensual bruto",
      icon: Calendar,
      iconColor: "#8b5cf6",
      iconBg: "#f5f3ff",
      accent: "#8b5cf6",
    },
  ];

  return (
    <BackofficePageShell maxWidth="7xl" className="space-y-5">

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <article
              key={card.id}
              className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              {/* franja de color lateral */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "4px",
                  height: "100%",
                  background: card.accent,
                  borderRadius: "16px 0 0 16px",
                }}
              />
              <div className="flex items-start justify-between gap-2 pl-2">
                <p className="text-sm font-medium text-slate-500">{card.label}</p>
                <div
                  style={{ background: card.iconBg, borderRadius: "10px" }}
                  className="flex shrink-0 items-center justify-center p-2"
                >
                  <Icon className="h-4 w-4" style={{ color: card.iconColor }} />
                </div>
              </div>
              <p
                className="mt-3 pl-2 text-2xl font-extrabold tabular-nums tracking-tight text-slate-800 sm:text-3xl"
                style={{ lineHeight: 1.1 }}
              >
                {card.value}
              </p>
              <p className="mt-1.5 pl-2 text-xs text-slate-400">{card.sub}</p>
            </article>
          );
        })}
      </div>

      {/* ── Fila 2: Gráfico de barras | Productos más vendidos ── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 lg:items-stretch">

        {/* Gráfico Evolución Mensual — ocupa 2/3 */}
        <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                  <BarChart2 className="h-4 w-4 text-blue-500" />
                </div>
                <h2 className="text-base font-bold text-slate-800">Evolución de Ingresos</h2>
              </div>
              <p className="mt-1 pl-10 text-xs text-slate-400">{rangeLabel}</p>
            </div>
            <div className="shrink-0 rounded-xl border border-blue-100 bg-blue-50 px-3 py-1.5 text-right">
              <p className="text-[10px] font-medium uppercase tracking-wide text-blue-400">Mes actual</p>
              <p className="text-sm font-bold tabular-nums text-blue-700">
                {formatCurrency(kpis.ventasMes, currencySymbol)}
              </p>
            </div>
          </div>

          {/* Stats row */}
          <div className="mb-4 grid grid-cols-3 divide-x divide-slate-100 rounded-xl border border-slate-100 bg-slate-50">
            {[
              { label: "Semana", val: formatCurrency(kpis.ventasSemana, currencySymbol) },
              { label: "Mes", val: formatCurrency(kpis.ventasMes, currencySymbol) },
              { label: "Histórico", val: formatCurrency(kpis.totalHistorico, currencySymbol) },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center py-2.5">
                <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{item.label}</p>
                <p className="mt-0.5 text-sm font-bold tabular-nums text-slate-700">{item.val}</p>
              </div>
            ))}
          </div>

          {/* Bar chart */}
          <div className="flex-1" style={{ minHeight: "200px" }}>
            {salesSeries.length === 0 ? (
              <div className="flex h-full min-h-[180px] items-center justify-center rounded-xl border border-dashed border-slate-200 text-sm text-slate-400">
                Sin datos disponibles aún
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                <BarChart data={salesSeries} margin={{ top: 8, right: 8, left: -10, bottom: 0 }} barCategoryGap="30%">
                  <defs>
                    <linearGradient id="blueBarGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                      <stop offset="100%" stopColor="#93c5fd" stopOpacity={0.7} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: "#94a3b8", fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#cbd5e1" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={formatYAxis}
                    width={45}
                  />
                  <Tooltip
                    content={<ChartTooltip currencySymbol={currencySymbol} />}
                    cursor={{ fill: "#eff6ff", radius: 6 }}
                  />
                  <Bar dataKey="total" radius={[6, 6, 0, 0]} maxBarSize={52} fill="url(#blueBarGrad)">
                    {salesSeries.map((_, index) => (
                      <Cell key={`cell-${index}`} fill="url(#blueBarGrad)" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </article>

        {/* Productos más vendidos — 1/3 */}
        <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
              <Award className="h-4 w-4 text-amber-500" />
            </div>
            <h2 className="text-base font-bold text-slate-800">Top Productos</h2>
          </div>

          {safeProducts.length === 0 ? (
            <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-slate-200 text-sm text-slate-400">
              Sin datos de productos
            </div>
          ) : (
            <div className="flex flex-1 flex-col gap-4">
              {safeProducts.map((product, idx) => {
                const rankColors = ["#f59e0b", "#94a3b8", "#b45309"];
                const barColors = ["#3b82f6", "#93c5fd", "#bfdbfe"];
                return (
                  <div key={product.name} className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold text-white"
                        style={{ background: rankColors[idx] ?? "#94a3b8" }}
                      >
                        {product.rank}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-800">{product.name}</p>
                        <p className="text-[11px] text-slate-400">{product.sold} unidades vendidas</p>
                      </div>
                      <span className="shrink-0 text-sm font-bold tabular-nums text-slate-700">
                        {formatCurrency(product.amount, currencySymbol)}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.round((product.sold / maxProductSold) * 100)}%`,
                          background: barColors[idx] ?? "#93c5fd",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Mini stat transacciones hoy */}
          <div className="mt-5 flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-blue-400">
                Transacciones hoy
              </p>
              <p className="mt-0.5 text-xl font-extrabold text-blue-700">{kpis.ventasHoy}</p>
            </div>
            <ShoppingCart className="h-7 w-7 text-blue-300" />
          </div>
        </article>
      </div>

      {/* ── Fila 3: Ventas por categoría | Stock bajo ── */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

        {/* Ventas por categoría */}
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </div>
            <h2 className="text-base font-bold text-slate-800">Ventas por Categoría</h2>
          </div>

          {salesByCategory.length === 0 ? (
            <div className="flex h-[120px] items-center justify-center rounded-xl border border-dashed border-slate-200 text-sm text-slate-400">
              Sin datos de categorías
            </div>
          ) : (
            <div className="space-y-4">
              {salesByCategory.map((cat, idx) => {
                const palette = CAT_COLORS[idx % CAT_COLORS.length];
                const pct = Math.round((cat.total / maxCategoryTotal) * 100);
                return (
                  <div key={cat.name} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ background: palette.bar }}
                        />
                        <span className="truncate text-sm font-medium text-slate-700">{cat.name}</span>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span
                          className="rounded-md px-2 py-0.5 text-xs font-semibold"
                          style={{ background: palette.bg, color: palette.text }}
                        >
                          {pct}%
                        </span>
                        <span className="text-sm font-bold tabular-nums text-slate-700">
                          {formatCurrency(cat.total, currencySymbol)}
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: palette.bar }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </article>

        {/* Alertas de stock bajo */}
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50">
              <Package className="h-4 w-4 text-rose-400" />
            </div>
            <h2 className="text-base font-bold text-slate-800">Alertas de Inventario</h2>
          </div>

          {lowStockProducts.length === 0 ? (
            <div className="flex h-[120px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-blue-100 bg-blue-50/40 text-sm text-blue-600">
              <span className="text-2xl">✅</span>
              <span className="font-medium">Todo el stock está en orden</span>
              <span className="text-xs text-blue-400">Sin alertas de inventario</span>
            </div>
          ) : (
            <div className="space-y-3">
              {lowStockProducts.map((p) => {
                const ratio = p.min > 0 ? p.stock / p.min : 1;
                const pct = Math.min(Math.round(ratio * 100), 100);
                const isUrgent = ratio <= 0.5;
                return (
                  <div
                    key={p.name}
                    className="flex flex-col gap-1.5 rounded-xl border p-3"
                    style={{
                      borderColor: isUrgent ? "#fecaca" : "#fed7aa",
                      background: isUrgent ? "#fff8f8" : "#fffdf5",
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <AlertTriangle
                          className="h-4 w-4 shrink-0"
                          style={{ color: isUrgent ? "#ef4444" : "#f59e0b" }}
                        />
                        <span className="truncate text-sm font-semibold text-slate-700">{p.name}</span>
                      </div>
                      <span
                        className="shrink-0 rounded-lg px-2 py-0.5 text-xs font-semibold"
                        style={{
                          background: isUrgent ? "#fee2e2" : "#fef3c7",
                          color: isUrgent ? "#b91c1c" : "#92400e",
                        }}
                      >
                        {p.stock} / mín {p.min}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          background: isUrgent ? "#f87171" : "#fbbf24",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </article>
      </div>

    </BackofficePageShell>
  );
}
