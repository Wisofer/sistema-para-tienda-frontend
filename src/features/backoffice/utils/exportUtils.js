/**
 * Utilidades para exportación de datos a formatos descargables (CSV/Excel).
 */

/**
 * Genera y descarga un archivo CSV compatible con Excel (UTF-8 con BOM).
 * @param {Array<Object>} data Lista de objetos con los datos.
 * @param {Array<{label: string, key: string}>} headers Definición de columnas (etiqueta y clave en el objeto).
 * @param {string} filename Nombre del archivo (ej: 'productos.csv').
 */
export function downloadCSV(data, headers, filename) {
  if (!data || data.length === 0) return;

  // 1. Crear cabecera
  const headerRow = headers.map(h => `"${h.label.replace(/"/g, '""')}"`).join(",");
  
  // 2. Crear filas de datos
  const rows = data.map(item => {
    return headers.map(h => {
      let val = item[h.key];
      if (val === null || val === undefined) val = "";
      // Escapar comillas dobles y envolver en comillas
      const stringVal = String(val).replace(/"/g, '""');
      return `"${stringVal}"`;
    }).join(",");
  });

  // 3. Unir todo
  const csvString = [headerRow, ...rows].join("\r\n");

  // 4. Añadir BOM (Byte Order Mark) para que Excel reconozca UTF-8 correctamente
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvString], { type: "text/csv;charset=utf-8;" });
  
  // 5. Descargar
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
