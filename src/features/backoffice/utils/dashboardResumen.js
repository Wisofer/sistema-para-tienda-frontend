/**
 * KPIs de GET /api/v1/dashboard/resumen (variantes camelCase / PascalCase).
 */

const ORDENES_HOY_KEYS = [
  "totalOrdenesHoy",
  "TotalOrdenesHoy",
  "ordenesHoy",
  "OrdenesHoy",
  "cantidadVentasHoy",
  "CantidadVentasHoy",
  "cantidadTicketsHoy",
  "CantidadTicketsHoy",
  "ticketsHoy",
  "TicketsHoy",
  "numeroVentasHoy",
  "NumeroVentasHoy",
];

function firstNonNegativeInt(obj, keys) {
  if (!obj || typeof obj !== "object") return null;
  for (const key of keys) {
    const v = obj[key];
    if (v == null || v === "") continue;
    const n = Number(v);
    if (Number.isFinite(n) && n >= 0) return Math.trunc(n);
  }
  return null;
}

/**
 * Cantidad de ventas/tickets de hoy. Si el API no manda el conteo (o manda 0) pero sí hay
 * ingreso y ticket promedio del día, se estima round(total / ticket) como respaldo.
 */
export function dashboardTransaccionesHoy(dashboard) {
  const d = dashboard && typeof dashboard === "object" ? dashboard : {};
  const k = d.kpis && typeof d.kpis === "object" ? d.kpis : {};

  let count = firstNonNegativeInt(k, ORDENES_HOY_KEYS);
  if (count == null) count = firstNonNegativeInt(d, ORDENES_HOY_KEYS);
  if (count == null) count = 0;

  const total = Number(
    k.totalVentasHoy ?? k.TotalVentasHoy ?? d.totalVentasHoy ?? d.TotalVentasHoy ?? 0
  );
  const ticket = Number(
    k.ticketPromedioHoy ?? k.TicketPromedioHoy ?? d.ticketPromedioHoy ?? d.TicketPromedioHoy ?? 0
  );

  if (count > 0) return count;
  if (total > 0 && ticket > 0) return Math.max(1, Math.round(total / ticket));
  return 0;
}
