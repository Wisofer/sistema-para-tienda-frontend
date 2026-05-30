/**
 * Normaliza respuestas de caja (.NET suele serializar en PascalCase).
 */

export function pickFirstFiniteNumber(obj, keys) {
  if (!obj || typeof obj !== "object") return null;
  for (const k of keys) {
    if (!Object.prototype.hasOwnProperty.call(obj, k)) continue;
    const v = obj[k];
    if (v == null || v === "") continue;
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

/** Monto a mostrar en filas de historial (real contado, o totales que envíe el API). */
export function cierreHistorialMontoPrincipal(item) {
  const n = pickFirstFiniteNumber(item, [
    "montoReal",
    "MontoReal",
    "montoContado",
    "MontoContado",
    "montoCierre",
    "MontoCierre",
    "total",
    "Total",
    "montoEsperado",
    "MontoEsperado",
    "totalVentas",
    "TotalVentas",
    "totalEfectivo",
    "TotalEfectivo",
  ]);
  return n ?? 0;
}

export function cierreHistorialTotalVentas(item) {
  const n = pickFirstFiniteNumber(item, [
    "totalVentas",
    "TotalVentas",
    "totalGeneral",
    "TotalGeneral",
    "totalVenta",
    "TotalVenta",
    "ventasTotal",
    "VentasTotal",
    "total",
    "Total",
  ]);
  return n ?? 0;
}

export function cierreHistorialMontoInicial(item) {
  return pickFirstFiniteNumber(item, ["montoInicial", "MontoInicial"]) ?? 0;
}

export function cierreHistorialMontoEsperado(item) {
  return pickFirstFiniteNumber(item, ["montoEsperado", "MontoEsperado"]) ?? 0;
}

/** Contado en caja (arqueo físico); puede ser null si el turno sigue abierto. */
export function cierreHistorialMontoReal(item) {
  const n = pickFirstFiniteNumber(item, ["montoReal", "MontoReal", "montoContado", "MontoContado"]);
  return n;
}

/**
 * Diferencia guardada en servidor o calculada (real − esperado) cuando ambos existen.
 * Devuelve null si no aplica (ej. caja abierta sin conteo).
 */
export function cierreHistorialDiferencia(item) {
  const explicit = pickFirstFiniteNumber(item, ["diferencia", "Diferencia"]);
  if (explicit != null) return explicit;
  const esp = cierreHistorialMontoEsperado(item);
  const real = cierreHistorialMontoReal(item);
  if (real == null) return null;
  return real - esp;
}

export function cierreFechaRaw(item) {
  if (!item || typeof item !== "object") return "";
  return (
    item.fechaHoraCierre ??
    item.FechaHoraCierre ??
    item.fechaCierre ??
    item.FechaCierre ??
    item.fecha ??
    item.Fecha ??
    item.createdAt ??
    item.CreatedAt ??
    item.fechaApertura ??
    item.FechaApertura ??
    ""
  );
}

export function cierreId(item) {
  if (!item || typeof item !== "object") return undefined;
  const v = item.id ?? item.Id;
  return v != null ? v : undefined;
}

export function cierreDetalleMontoEsperado(d) {
  return pickFirstFiniteNumber(d || {}, ["montoEsperado", "MontoEsperado", "totalEsperado", "TotalEsperado"]) ?? 0;
}

export function cierreDetalleMontoReal(d) {
  return pickFirstFiniteNumber(d || {}, ["montoReal", "MontoReal", "montoContado", "MontoContado"]) ?? 0;
}

/** Contado físico; null si aún no hubo arqueo (ej. turno abierto). */
export function cierreDetalleMontoRealNullable(d) {
  return pickFirstFiniteNumber(d || {}, ["montoReal", "MontoReal", "montoContado", "MontoContado"]);
}

export function cierreDetalleDiferencia(d) {
  const explicit = pickFirstFiniteNumber(d || {}, ["diferencia", "Diferencia"]);
  if (explicit != null) return explicit;
  const real = pickFirstFiniteNumber(d || {}, ["montoReal", "MontoReal", "montoContado", "MontoContado"]);
  if (real == null) return null;
  const esp = cierreDetalleMontoEsperado(d);
  return real - esp;
}

export function cierreDetalleMontoInicial(d) {
  return pickFirstFiniteNumber(d || {}, ["montoInicial", "MontoInicial"]) ?? 0;
}

export function cierreDetalleTotalGeneral(d) {
  return pickFirstFiniteNumber(d || {}, ["totalGeneral", "TotalGeneral"]) ?? 0;
}

export function cierreDetalleTexto(d, keys) {
  if (!d || typeof d !== "object") return "";
  for (const k of keys) {
    if (!Object.prototype.hasOwnProperty.call(d, k)) continue;
    const v = d[k];
    if (v == null || v === "") continue;
    return String(v);
  }
  return "";
}

/** Fecha/hora corta para encabezados de detalle de cierre. */
export function cierreDetalleFechaDisplay(d) {
  if (!d || typeof d !== "object") return "—";
  const raw =
    d.fechaHoraCierre ?? d.FechaHoraCierre ?? d.fechaCierre ?? d.FechaCierre ?? "";
  const s = String(raw).trim();
  return s ? s.slice(0, 16).replace("T", " ") : "—";
}

/** Clase Tailwind para el color del número de diferencia (faltante / sobrante). */
export function diffAmountTextClass(diffVal) {
  if (diffVal == null || !Number.isFinite(Number(diffVal))) return "text-slate-600";
  const n = Number(diffVal);
  if (n < 0) return "text-red-700";
  if (n > 0) return "text-emerald-700";
  return "text-slate-800";
}

/** Totales por medio de pago en el detalle de cierre (API). */
export function cierreDetalleMediosPago(d) {
  if (!d || typeof d !== "object") {
    return { efectivo: null, tarjeta: null, transferencia: null };
  }
  return {
    efectivo: pickFirstFiniteNumber(d, ["totalEfectivo", "TotalEfectivo"]),
    tarjeta: pickFirstFiniteNumber(d, ["totalTarjeta", "TotalTarjeta"]),
    transferencia: pickFirstFiniteNumber(d, ["totalTransferencia", "TotalTransferencia"]),
  };
}

/** Fuentes anidadas del preview de cierre (`GET /caja/cierre/preview`). */
function cajaPreviewSources(preview) {
  if (!preview || typeof preview !== "object") return [];
  const totales = preview.totales ?? preview.Totales;
  const cierre = preview.cierre ?? preview.Cierre;
  const resumen = preview.resumen ?? preview.Resumen;
  const kpis = preview.kpis ?? preview.Kpis;
  const out = [preview];
  for (const block of [totales, cierre, resumen, kpis]) {
    if (block && typeof block === "object") out.push(block);
  }
  return out;
}

function pickFromPreviewSources(preview, keys) {
  for (const src of cajaPreviewSources(preview)) {
    const n = pickFirstFiniteNumber(src, keys);
    if (n != null) return n;
  }
  return null;
}

/** Efectivo / tarjeta / transferencia cobrados en el turno (preview abierto). */
export function cajaPreviewMediosPago(preview) {
  const efectivo = pickFromPreviewSources(preview, [
    "totalEfectivo",
    "TotalEfectivo",
    "efectivo",
    "Efectivo",
    "ventasEfectivo",
    "VentasEfectivo",
  ]);
  const tarjeta = pickFromPreviewSources(preview, [
    "totalTarjeta",
    "TotalTarjeta",
    "tarjeta",
    "Tarjeta",
    "ventasTarjeta",
    "VentasTarjeta",
  ]);
  const transferencia = pickFromPreviewSources(preview, [
    "totalTransferencia",
    "TotalTransferencia",
    "transferencia",
    "Transferencia",
    "ventasTransferencia",
    "VentasTransferencia",
  ]);
  return {
    efectivo: efectivo ?? 0,
    tarjeta: tarjeta ?? 0,
    transferencia: transferencia ?? 0,
  };
}

/** Ventas netas del turno (preview). Respaldo: suma de medios de pago. */
export function cajaPreviewTotalVentas(preview) {
  const direct = pickFromPreviewSources(preview, [
    "totalVentasNetas",
    "TotalVentasNetas",
    "totalGeneral",
    "TotalGeneral",
    "totalVentas",
    "TotalVentas",
    "ventasNetas",
    "VentasNetas",
    "ventasTotal",
    "VentasTotal",
  ]);
  if (direct != null && direct > 0) return direct;

  const { efectivo, tarjeta, transferencia } = cajaPreviewMediosPago(preview);
  const sumMedios = efectivo + tarjeta + transferencia;
  if (sumMedios > 0) return sumMedios;

  return direct ?? 0;
}

/** Tickets / órdenes cobradas en el turno (preview). */
export function cajaPreviewTotalOrdenes(preview, estado = null) {
  const sources = [...cajaPreviewSources(preview)];
  if (estado && typeof estado === "object") {
    sources.push(estado);
    const caja = estado.caja ?? estado.Caja;
    if (caja && typeof caja === "object") sources.push(caja);
  }

  const keys = [
    "totalOrdenesPagadas",
    "TotalOrdenesPagadas",
    "totalOrdenes",
    "TotalOrdenes",
    "totalTickets",
    "TotalTickets",
    "totalPagos",
    "TotalPagos",
    "cantidadTickets",
    "CantidadTickets",
    "cantidadVentas",
    "CantidadVentas",
    "numeroVentas",
    "NumeroVentas",
    "ticketsCobrados",
    "TicketsCobrados",
    "ventasRealizadas",
    "VentasRealizadas",
  ];

  for (const src of sources) {
    const n = pickFirstFiniteNumber(src, keys);
    if (n != null && n > 0) return Math.trunc(n);
  }

  for (const src of sources) {
    for (const key of ["ventas", "Ventas", "tickets", "Tickets", "items", "Items"]) {
      const arr = src[key];
      if (Array.isArray(arr) && arr.length > 0) return arr.length;
    }
  }

  const ventas = cajaPreviewTotalVentas(preview);
  let ticket = null;
  for (const src of sources) {
    ticket = pickFirstFiniteNumber(src, [
      "ticketPromedio",
      "TicketPromedio",
      "promedioTicket",
      "PromedioTicket",
    ]);
    if (ticket != null && ticket > 0) break;
  }
  if (ventas > 0 && ticket != null && ticket > 0) {
    return Math.max(1, Math.round(ventas / ticket));
  }

  return 0;
}

/** Estima tickets cuando el preview trae ventas pero no el conteo. */
export function estimateTicketsFromVentasAndPromedio(ventas, ticketPromedio) {
  const total = Number(ventas ?? 0);
  const ticket = Number(ticketPromedio ?? 0);
  if (!Number.isFinite(total) || total <= 0) return 0;
  if (!Number.isFinite(ticket) || ticket <= 0) return 0;
  return Math.max(1, Math.round(total / ticket));
}

/** Ticket promedio desde KPIs del dashboard (GET /dashboard/resumen). */
export function ticketPromedioFromDashboardResumen(dashboard) {
  const d = dashboard && typeof dashboard === "object" ? dashboard : {};
  const k = d.kpis && typeof d.kpis === "object" ? d.kpis : {};
  const raw =
    k.ticketPromedioHoy ??
    k.TicketPromedioHoy ??
    d.ticketPromedioHoy ??
    d.TicketPromedioHoy ??
    k.ticketPromedio ??
    k.TicketPromedio ??
    d.ticketPromedio ??
    d.TicketPromedio;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function cajaPreviewMontoEsperado(preview, montoInicial = 0) {
  const direct = pickFromPreviewSources(preview, ["montoEsperado", "MontoEsperado"]);
  if (direct != null) return direct;
  const fondo = Number(montoInicial || 0);
  const { efectivo } = cajaPreviewMediosPago(preview);
  return fondo + efectivo;
}

export function cajaPreviewMontoInicial(preview, estado = null) {
  const fromPreview = pickFromPreviewSources(preview, [
    "montoInicial",
    "MontoInicial",
    "montoApertura",
    "MontoApertura",
  ]);
  if (fromPreview != null) return fromPreview;
  if (estado && typeof estado === "object") {
    const fromEstado = pickFirstFiniteNumber(estado, [
      "montoInicial",
      "MontoInicial",
      "montoApertura",
      "MontoApertura",
    ]);
    if (fromEstado != null) return fromEstado;
    const caja = estado.caja ?? estado.Caja;
    if (caja && typeof caja === "object") {
      const fromCaja = pickFirstFiniteNumber(caja, ["montoInicial", "MontoInicial"]);
      if (fromCaja != null) return fromCaja;
    }
  }
  return 0;
}
