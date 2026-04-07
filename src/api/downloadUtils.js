/**
 * Dispara descarga de un Blob en el navegador (Excel, PDF, etc.).
 */
export function downloadBlobAsFile(blob, filename) {
  if (!(blob instanceof Blob)) {
    throw new Error("La exportación no devolvió un archivo descargable.");
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.visibility = "hidden";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
