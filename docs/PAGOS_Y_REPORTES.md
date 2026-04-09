# Pagos (métodos / moneda) y reportes

Información alineada con el **backend** para diseño de UI, reportes y expectativas de datos.

## Métodos de pago

El API guarda cada cobro en **`Pagos`** con:

- **`tipoPago`**: típicamente **Efectivo**, **Tarjeta**, **Transferencia** (y en dominio servidor también **Mixto** según reglas).
- **`moneda`**: córdobas vs dólares (el POS suele enviar lo que el usuario elige; el servidor aplica tipo de cambio cuando corresponde).
- Opcional: **banco**, **tipo de cuenta** (transferencias).

Ese registro se crea al **`POST /api/v1/ventas/procesar-pago`** (o `gestionar-pago`) junto con montos y descuentos.

## Qué muestran los reportes hoy

| Qué necesitas | Estado actual |
|---------------|----------------|
| **Total neto cobrado** por ticket / período | Suele estar **sí** en reportes de ventas (criterio de **pagos** / neto). |
| **Subtotal de líneas** (antes de descuento global) | **Sí** en detalle de ventas. |
| **Con qué método pagó** (efectivo / tarjeta / transferencia / USD) **por cada ticket** en el listado estándar de reportes | El DTO del detalle de ventas **no incluye** hoy columnas de método/moneda; los datos **sí existen** en `Pagos` en el servidor. |
| **Totales por día** efectivo vs tarjeta vs transferencia | **Caja** (cierre / resumen) trabaja ese desglose a nivel de **caja del día**, no sustituye un “listado de ventas por método”. |

## Si el cliente quiere “reporte por método de pago”

Es una **evolución de API/reportes** (consultas o nuevos campos desde `Pagos`), no un cambio de cómo se cobra en el POS.

## Documentación extendida en el backend

Detalle de implementación global (descuentos, ticket, JWT, etc.): en el repositorio backend, `docs/IMPLEMENTACION_REPORTES_CAJA_DESCUENTOS_TICKET.md` — sección **“10. Métodos de pago y reportes”**.
