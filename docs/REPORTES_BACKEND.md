# Reportes y exportación (integración con el backend)

Los **archivos Excel** de la sección **Reportes y Estadísticas** los **genera el API**; el front solo pide el blob y dispara la descarga (`fetchExportBlob` / `downloadBlobAsFile`). No se construye CSV ni XLSX en el cliente para esos botones.

## Dónde está la lógica en el front

- Hook: `src/features/backoffice/hooks/useReports.js` → `downloadExcel(reportId)`.
- Puente: `src/features/backoffice/services/backofficeApi.js` (nombres de funciones que llaman a `reportsApi`, `cajaApi`, `productsApi`).

## Mapeo reporte → export (resumen)

| `reportId` (UI) | Función backoffice | Notas |
|-----------------|-------------------|--------|
| `ventas` | `reportesExportarVentasDetalleExcel` | Filtro `filtroVentas` + fechas |
| `productos-top` | `reportesExportarProductosTopExcel` | `top` + fechas; el API incluye **`categoria`** por producto |
| `vendedores` | `reportesExportarVentasPorVendedorExcel` | Fechas |
| `categorias` | `reportesExportarVentasPorCategoriaDesgloseExcel` | Fechas |
| `caja` | `exportarCajaHistorialExcel` | `GET /api/v1/caja/historial/exportar` (Cajero/Admin) |
| `movimientos` | `exportarMovimientosInventarioExcel` | `GET /api/v1/inventario/movimientos/exportar` (**rol Admin**) |

La **carga de tablas** (`loadReportData`) usa los mismos criterios de fechas donde aplica; sigue siendo JSON desde el backend.

## Documentación del API

Contrato detallado: repositorio del backend (rutas bajo `/api/v1/reportes`, `/api/v1/caja`, `/api/v1/inventario`).

## Pagos y métodos (lectura para producto)

Qué **métodos de pago** existen, qué **muestran los reportes** (neto vs método por ticket) y qué hay en **caja**: ver **[PAGOS_Y_REPORTES.md](./PAGOS_Y_REPORTES.md)**.
