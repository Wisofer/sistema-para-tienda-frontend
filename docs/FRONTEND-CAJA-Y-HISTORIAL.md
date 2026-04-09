# Frontend: Caja, historial y reporte de caja

Guía para desarrolladores: dónde está la lógica, qué endpoints usa el front y cómo se normalizan los datos (PascalCase / camelCase del API .NET).

- **Autenticación:** Rutas de caja requieren JWT y rol con política **Cajero** (Administrador / Cajero según backend).
- **Base URL:** La configurada en `src/api/config.js` (misma que el resto del backoffice).

---

## 1. Capa API (`src/api/caja.js`)

| Método | Uso |
|--------|-----|
| `cajaApi.estado()` | `GET /api/v1/caja/estado` — caja abierta/cerrada y último cierre resumido. |
| `cajaApi.apertura(montoInicial)` | `POST /api/v1/caja/apertura` |
| `cajaApi.cierrePreview()` | `GET /api/v1/caja/cierre/preview` |
| `cajaApi.cierre(body)` | `POST /api/v1/caja/cierre` — `{ montoReal, observaciones }` |
| `cajaApi.historial(params)` | `GET /api/v1/caja/historial?page=&pageSize=&desde=&hasta=` |
| `cajaApi.detalle(id)` | `GET /api/v1/caja/cierres/{id}` — detalle completo de un cierre (modal **Detalle**). |
| `cajaApi.exportarHistorialExcel(params)` | `GET /api/v1/caja/historial/exportar` — descarga Excel. |

El cliente HTTP (`src/api/client.js`) desempaqueta respuestas `{ success, data }` del backend y devuelve solo `data`.

**Alias del backend:** el mismo detalle está disponible en `GET /api/v1/caja/historial/{id}`; el front usa **`cierres/{id}`** como ruta principal.

---

## 2. Puente backoffice (`src/features/backoffice/services/backofficeApi.js`)

Funciones expuestas a la UI (nombres históricos):

| Función | Implementación |
|---------|----------------|
| `cajaEstado` | `cajaApi.estado()` |
| `cajaApertura` / `cajaAbrir` | `cajaApi.apertura` |
| `cajaCierrePreview` | `cajaApi.cierrePreview` |
| `cajaCerrar` | `cajaApi.cierre` |
| `cajaHistorial` | `cajaApi.historial` |
| `exportarCajaHistorialExcel` | `cajaApi.exportarHistorialExcel` |
| `cajaDetalleCierre(id)` | `cajaApi.detalle(id)` — devuelve `null` si `id` vacío; si el API falla, lanza (el hook muestra snackbar). |

En modo mock local, `localBackofficeApi.js` puede sustituir estos métodos; incluye un objeto de ejemplo para `cajaDetalleCierre`.

---

## 3. Hook `useCashier` (`src/features/backoffice/hooks/useCashier.js`)

Estado y acciones del módulo caja:

- **Carga inicial:** estado, preview de cierre (si hay caja abierta), historial paginado.
- **`loadAll(page)`** — refresca listado e historial.
- **`handleAperturaCaja` / `handleCerrarCaja`** — formularios de apertura y cierre.
- **`loadDetalleCierre(id)`** — obtiene detalle y guarda en `cierreDetalle`; errores → snackbar y limpieza de detalle.
- **`clearCierreDetalle()`** — cierra el panel de detalle en pantalla.

Constantes de paginación: `PAGINATION.LIST_DEFAULT` (historial).

---

## 4. Componentes de pantalla

### `CashierView.jsx`

Orquesta tarjetas de estado, formularios, resumen y **`CashierHistory`**. Recibe `currencySymbol` (símbolo de moneda para formateo).

### `CashierHistory.jsx` (`src/features/backoffice/components/cashier/`)

- Lista paginada de cierres; botón **Detalle** llama `loadDetalleCierre(cierreId)`.
- Panel de detalle muestra: apertura, ventas totales, esperado, contado, diferencia (colores según sobrante/faltante), efectivo/tarjeta/transferencia, usuario, observaciones, botón **Cerrar** (`clearCierreDetalle`).

### Reportes — tabla de caja (`ReportTables.jsx`)

Cuando `activeReport === "caja"`, se renderiza **`CajaTable`**: columnas **Cierre**, **Fecha**, **Estado**, **Apertura**, **Ventas**, **Esperado**, **Contado**, **Diferencia**.

Los datos vienen del mismo flujo de reportes que rellena `rows` para el reporte de caja (servicio de reportes / backoffice según implementación actual).

---

## 5. Utilidades `src/features/backoffice/utils/caja.js`

Funciones para leer campos con nombres **camelCase** o **PascalCase**:

| Función | Uso |
|---------|-----|
| `pickFirstFiniteNumber(obj, keys)` | Primer número finito entre varias claves. |
| `cierreId`, `cierreFechaRaw` | Id y fecha/hora para filas. |
| `cierreHistorialMontoPrincipal` | Monto principal en lista (prioriza contado real). |
| `cierreHistorialTotalVentas` | Total ventas (`totalGeneral`, etc.). |
| `cierreHistorialMontoInicial`, `cierreHistorialMontoEsperado`, `cierreHistorialMontoReal`, `cierreHistorialDiferencia` | Columnas del reporte historial. |
| `cierreDetalleMontoEsperado`, `cierreDetalleMontoReal`, `cierreDetalleMontoRealNullable`, `cierreDetalleDiferencia`, `cierreDetalleMontoInicial`, `cierreDetalleTotalGeneral` | Panel detalle. |
| `cierreDetalleTexto(d, keys)` | Cadenas (observaciones, usuario). |

**Formato de moneda:** `formatCurrency` en `utils/currency.js` (símbolo configurable).

---

## 6. Respuesta esperada del detalle de cierre (referencia)

El backend devuelve en `data` un objeto alineado con el cierre; campos típicos (nombres en camelCase tras serialización):

`id`, `fechaCierre`, `fechaHoraCierre`, `estado`, `montoInicial`, `totalEfectivo`, `totalTarjeta`, `totalTransferencia`, `totalCordobas`, `totalDolares`, `totalGeneral`, `totalOrdenes`, `totalPagos`, `montoEsperado`, `montoReal`, `diferencia`, `observaciones`, `usuario`.

Si falta un valor numérico (p. ej. caja abierta sin conteo), la UI muestra **—** donde corresponde.

---

## 7. Listado de historial (referencia)

Cada ítem puede incluir: `id`, `fechaCierre`, `fechaHoraCierre`, `estado`, `montoInicial`, `totalGeneral`, `totalEfectivo`, `totalTarjeta`, `montoEsperado`, `montoReal`, `diferencia`, `usuario`.

---

## 8. Errores comunes

| Síntoma | Causa probable |
|---------|----------------|
| **Detalle** no carga | Backend sin `GET /api/v1/caja/cierres/{id}`, token sin permiso, o id inválido (404). |
| Montos en cero o raros | Revisar que el listado incluya `montoEsperado` / `diferencia`; comprobar helpers en `caja.js`. |
| Excel no descarga | Revisar `exportarHistorialExcel` y CORS en entorno local (`docs/BACKEND-CORS-Y-AUTH.md`). |
