import { 
  BarChart3, 
  Boxes, 
  Users, 
  Tags, 
  CircleDollarSign, 
  History 
} from "lucide-react";

/**
 * Catálogo de reportes disponibles en el sistema.
 */
export const reportCards = [
  {
    id: "ventas",
    title: "Reporte de Ventas",
    description: "Ventas por periodo con métricas generales y desglose diario.",
    icon: BarChart3,
    color: "bg-blue-100 text-blue-600",
    button: "Ver reporte",
  },
  {
    id: "productos-top",
    title: "Productos Más Vendidos",
    description: "Top de productos por cantidad vendida y total de ventas.",
    icon: Boxes,
    color: "bg-green-100 text-green-600",
    button: "Ver reporte",
  },
  {
    id: "vendedores",
    title: "Ventas por Vendedor",
    description: "Desempeño de ventas por cada usuario del sistema.",
    icon: Users,
    color: "bg-purple-100 text-purple-600",
    button: "Ver reporte",
  },
  {
    id: "categorias",
    title: "Ventas por Categoría",
    description: "Desglose de ventas agrupadas por categoría de producto.",
    icon: Tags,
    color: "bg-orange-100 text-orange-600",
    button: "Ver reporte",
  },
  {
    id: "caja",
    title: "Cierre de Caja",
    description: "Historial de aperturas y cierres de caja con arqueo.",
    icon: CircleDollarSign,
    color: "bg-amber-100 text-amber-600",
    button: "Ver reporte",
  },
  {
    id: "movimientos",
    title: "Movimientos de Inventario",
    description: "Registro de entradas, salidas y ajustes de stock de productos.",
    icon: History,
    color: "bg-red-100 text-red-600",
    button: "Ver reporte",
  },
];

/** 
 * Resuelve el nombre de una categoría para mostrar en los reportes.
 * Maneja las distintas formas en las que la API puede devolver el nombre.
 */
export function categoriaReporteNombre(row, index) {
  const r = row || {};
  return (
    r.nombreCategoria ??
    r.NombreCategoria ??
    r.categoriaNombre ??
    r.CategoriaNombre ??
    r.categoria ??
    r.nombre ??
    r.label ??
    (r.categoriaId != null || r.CategoriaProductoId != null
      ? `Categoría #${r.categoriaId ?? r.CategoriaProductoId}`
      : null) ??
    `Categoría ${index + 1}`
  );
}
