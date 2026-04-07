import {
  normalizeOpcionesSeleccionadas,
  opcionesResumenSoloTextoOpcion,
  opcionesSeleccionadasKey,
  withOpcionesSeleccionadas,
} from "./productoOpciones.js";
import { compactVarianteEtiquetaCarrito } from "./posVariantes.js";

/**
 * Une líneas duplicadas (mismo producto + variante + opciones) por carreras de clic o estado viejo.
 * Evita enviar dos filas al API cuando el usuario sumó una sola unidad lógica.
 */
export function mergeDuplicateCartLines(cart) {
  const list = Array.isArray(cart) ? cart : [];
  const map = new Map();
  for (const line of list) {
    const pid = Number(line?.id);
    if (!Number.isFinite(pid)) continue;
    const vidRaw = line?.varianteId;
    const vid =
      vidRaw != null && vidRaw !== "" && Number.isFinite(Number(vidRaw)) && Number(vidRaw) > 0
        ? Number(vidRaw)
        : "";
    const opKey = opcionesSeleccionadasKey(line?.opcionesSeleccionadas);
    const key = `${pid}|${vid}|${opKey}`;
    const prev = map.get(key);
    if (prev) {
      prev.qty = normalizePosItemCantidad(Number(prev.qty || 0) + Number(line.qty || 0));
    } else {
      map.set(key, { ...line, qty: normalizePosItemCantidad(line.qty) });
    }
  }
  return Array.from(map.values());
}

/** Línea sin variante ni opciones: se puede fusionar por mismo producto al sumar cantidad. */
export function posLineEsProductoSimpleSinOpciones(line) {
  return (
    line &&
    line.varianteId == null &&
    !(Array.isArray(line.opcionesSeleccionadas) && line.opcionesSeleccionadas.length > 0)
  );
}

/** Cantidad entera ≥ 1 para el API (1 unidad vendida = −1 stock; evita NaN/0/fracciones raras). */
export function normalizePosItemCantidad(qty) {
  const n = Number(qty);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

/** Líneas del carrito POS → cuerpo `Items` de POST /pos/ventas (Retail). */
export function posCartToRetailItems(cart) {
  const list = Array.isArray(cart) ? cart : [];
  return list.map((x) => {
    const vid = Number(x.varianteId);
    return {
      ProductoId: Number(x.id),
      ProductoVarianteId: Number.isFinite(vid) && vid > 0 ? vid : null,
      Cantidad: normalizePosItemCantidad(x.qty),
    };
  });
}

/** Líneas del carrito POS → cuerpo `productos` de legacy /pos/ordenes. */
export function posCartToPosOrdenProductos(cart) {
  const list = Array.isArray(cart) ? cart : [];
  return list.map((x) =>
    withOpcionesSeleccionadas(
      {
        productoId: Number(x.id),
        cantidad: Number(x.qty),
        notas: String(x.notas ?? "").trim(),
      },
      x.opcionesSeleccionadas
    )
  );
}

/** Líneas del carrito POS → `items` de PUT pedido (servicioId como en el backend actual). */
export function posCartToPedidoItemsPayload(cart) {
  const list = Array.isArray(cart) ? cart : [];
  return list.map((x) =>
    withOpcionesSeleccionadas(
      {
        servicioId: Number(x.id),
        cantidad: Number(x.qty),
        precioUnitario: Number(x.price || 0),
        estado: "Listo",
        notas: String(x.notas ?? "").trim(),
      },
      x.opcionesSeleccionadas
    )
  );
}

/** Respuesta API envuelta { data } | { Data } o cuerpo plano. */
export function unwrapEnvelope(raw) {
  if (raw == null) return raw;
  return raw.data ?? raw.Data ?? raw;
}

export function getOrdenPedidoId(order, fallback = null) {
  if (order == null || typeof order !== "object") return fallback;
  return (
    order.id ??
    order.Id ??
    order.ordenId ??
    order.OrdenId ??
    order.pedidoId ??
    order.PedidoId ??
    fallback
  );
}

export function getOrdenItems(order) {
  if (!order) return undefined;
  return order.items ?? order.Items;
}

/** ID devuelto por POST /pos/ordenes u objetos equivalentes. */
export function extractPosOrdenResponseId(data, fallback = null) {
  if (data == null || typeof data !== "object") return fallback;
  return (
    data.id ??
    data.Id ??
    data.ordenId ??
    data.OrdenId ??
    data.pedidoId ??
    data.PedidoId ??
    data.ventaId ??
    data.VentaId ??
    data.facturaId ??
    data.FacturaId ??
    data.orden?.id ??
    data.orden?.Id ??
    fallback
  );
}

/**
 * Respuesta de `procesar-pago` / `gestionar-pago` → id de venta para ticket PDF.
 * No usar `resp.id` / `resp.Id`: en muchos backends es el id del **movimiento de pago**, no de la venta,
 * y GET /ventas/{id}/ticket acaba mostrando otro recibo (producto/monto incorrectos).
 */
export function extractVentaIdFromPayment(resp) {
  if (resp == null || typeof resp !== "object") return null;
  const v =
    resp.ventaId ??
    resp.VentaId ??
    resp.venta?.id ??
    resp.venta?.Id ??
    resp.Venta?.Id ??
    resp.facturaId ??
    resp.FacturaId ??
    null;
  return v != null && v !== "" ? v : null;
}

export function mapBackendItemsToCart(items) {
  const list = Array.isArray(items) ? items : [];
  return list
    .map((it, idx) => {
      const opcionesSeleccionadas = normalizeOpcionesSeleccionadas(
        it?.opcionesSeleccionadas ?? it?.OpcionesSeleccionadas
      );
      const opcionesKey = opcionesSeleccionadasKey(opcionesSeleccionadas);

      const productoId =
        it?.productoId ??
        it?.ProductoId ??
        it?.servicioId ??
        it?.ServicioId ??
        it?.producto?.id ??
        it?.Producto?.Id ??
        it?.servicio?.id ??
        it?.Servicio?.Id ??
        idx;

      const backendLineId = it?.id ?? it?.Id;
      const lineId =
        backendLineId != null && backendLineId !== ""
          ? `b-${String(backendLineId)}`
          : `b-${idx}-${String(productoId)}-${opcionesKey || "x"}`;

      const qty = Number(it?.cantidad ?? it?.Cantidad ?? it?.qty ?? 0);
      const montoLinea = Number(it?.monto ?? it?.Monto ?? it?.total ?? it?.Total ?? it?.importe ?? it?.Importe ?? 0);
      const priceUnit = Number(
        it?.precioUnitario ?? it?.PrecioUnitario ?? it?.precio ?? it?.Precio ?? it?.precioUnitarioServicio ?? 0
      );
      const computedPrice = priceUnit > 0 ? priceUnit : qty > 0 ? montoLinea / qty : 0;
      const name =
        it?.producto?.nombre ??
        it?.Producto?.Nombre ??
        it?.servicio?.nombre ??
        it?.Servicio?.Nombre ??
        it?.nombre ??
        it?.Nombre ??
        it?.productoNombre ??
        it?.ProductoNombre ??
        it?.servicioNombre ??
        it?.ServicioNombre ??
        it?.servicio ??
        it?.Servicio ??
        it?.producto ??
        it?.Producto ??
        "Producto";

      const opcionesResumen = opcionesResumenSoloTextoOpcion(it?.opcionesResumen ?? it?.OpcionesResumen ?? "");
      const notas = String(it?.notas ?? it?.Notas ?? "").trim();

      const varianteIdRaw = it?.productoVarianteId ?? it?.ProductoVarianteId ?? null;
      const varianteIdNum =
        varianteIdRaw != null && varianteIdRaw !== "" ? Number(varianteIdRaw) : NaN;
      const varianteId =
        Number.isFinite(varianteIdNum) && varianteIdNum > 0 ? varianteIdNum : undefined;

      const tallaV = it?.talla ?? it?.Talla ?? it?.variante?.talla ?? it?.Variante?.Talla ?? "";
      const tallaStr = String(tallaV ?? "").trim();
      const tallaSolo =
        tallaStr && tallaStr.toUpperCase() !== "N/A" ? tallaStr : "";

      return {
        lineId,
        id: Number.isNaN(Number(productoId)) ? idx : Number(productoId),
        varianteId,
        name: String(name),
        price: Number.isFinite(computedPrice) ? computedPrice : 0,
        qty: qty > 0 ? qty : 0,
        opcionesSeleccionadas,
        opcionesKey,
        opcionesResumen: varianteId ? opcionesResumen || tallaSolo : opcionesResumen,
        notas,
        talla: tallaSolo || undefined,
      };
    })
    .filter((x) => x.qty > 0);
}

/** Líneas para modal de cobro / pre-cuenta local (mismo shape que espera el POS). */
export function posCartToModalLines(cart) {
  return cart.map((x) => {
    const rawClean = compactVarianteEtiquetaCarrito(x.opcionesResumen ?? "", x.talla);
    const resumen = opcionesResumenSoloTextoOpcion(rawClean);
    const note = String(x.notas ?? "").trim();
    let name = resumen ? `${x.name} — ${resumen}` : x.name;
    if (note) name = `${name} · ${note}`;
    return {
      id: x.lineId ?? x.id,
      name,
      qty: x.qty,
      price: x.price,
      lineTotal: Number(x.price || 0) * Number(x.qty || 0),
    };
  });
}

export function getPedidoMontoNumeric(pedido) {
  const m = pedido?.monto ?? pedido?.Monto ?? pedido?.total ?? pedido?.Total;
  if (m != null && Number.isFinite(Number(m))) return Number(m);
  return null;
}

export function normalizeApiErrorMessage(msg) {
  return String(msg ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

export function isCajaCerradaMessageNormalized(normalized) {
  return normalized.includes("caja") && normalized.includes("cerrada");
}

export function isStockShortageConflict409(status, normalized, excludeBecauseCajaCerrada = false) {
  if (status !== 409) return false;
  if (excludeBecauseCajaCerrada) return false;
  return (
    normalized.includes("stock") ||
    normalized.includes("inventario") ||
    normalized.includes("insuficiente") ||
    (normalized.includes("disponible") && normalized.includes("solicit"))
  );
}
