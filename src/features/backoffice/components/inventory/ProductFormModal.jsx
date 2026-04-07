import React from "react";
import { BackofficeDialog } from "../../components/index.js";
import { 
  productModalFieldClass, 
  productModalCodigoFieldClass,
  productModalInputLockedClass,
  productModalTextareaClass,
  fileToBase64 
} from "../../utils/inventoryUtils.js";
import { Upload, X } from "lucide-react";
import { useOnlineStatus } from "../../../../hooks/useOnlineStatus.js";
import { useSnackbar } from "../../../../contexts/SnackbarContext.jsx";
import { NETWORK_UI, offlineButtonTitle } from "../../../../constants/networkUi.js";
import { cn } from "../../../../utils/cn.js";
import { modalFormBodyScrollPlainClass, modalFormFooterClass, modalFormRootClass } from "../../utils/modalResponsiveClasses.js";

/**
 * Modal para la creación y edición de productos.
 */
export function ProductFormModal({
  modalOpen,
  setModalOpen,
  saving,
  form,
  setForm,
  saveProduct,
  categories,
  providers,
}) {
  const isOnline = useOnlineStatus();
  const snackbar = useSnackbar();

  if (!modalOpen) return null;

  const isEditing = Boolean(form?.id);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isOnline) {
      snackbar.error(NETWORK_UI.snackbarGuardar);
      return;
    }
    saveProduct(e);
  };

  return (
    <BackofficeDialog
      maxWidthClass="max-w-2xl"
      panelClassName="sm:mx-auto"
      onBackdropClick={saving ? undefined : () => setModalOpen(false)}
    >
      <form onSubmit={handleSubmit} className={modalFormRootClass}>
        {/* Título dinámico */}
        <h3 className="shrink-0 text-base font-semibold leading-tight text-slate-800 sm:text-lg">
          {form.id ? "Editar producto" : "Nuevo producto"}
        </h3>

        {/* Grid de Campos */}
        <div className={`${modalFormBodyScrollPlainClass} grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2 sm:items-start sm:gap-x-6 sm:gap-y-3`}>
          {/* Código SKU: mismo comportamiento visual que «Stock actual» al editar (disabled + estilos) */}
          <label className="min-w-0 block text-xs font-semibold text-slate-600">
            Código
            <input
              value={form.codigo}
              onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value }))}
              placeholder="Se generará automáticamente si se deja vacío"
              className={`${productModalCodigoFieldClass} ${productModalInputLockedClass}`}
              disabled={isEditing}
              title={isEditing ? "El código no se puede cambiar al editar un producto." : undefined}
              autoComplete="off"
            />
          </label>

          {/* Nombre del Producto */}
          <label className="min-w-0 text-xs font-semibold text-slate-600">
            Producto
            <input
              value={form.nombre}
              onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              placeholder="Nombre del producto"
              className={productModalFieldClass}
              required
              autoComplete="off"
            />
          </label>


          {/* Precios */}
          <label className="min-w-0 text-xs font-semibold text-slate-600">
            Precio venta
            <input
              type="number"
              step="0.01"
              inputMode="decimal"
              value={form.precioVenta}
              onChange={(e) => setForm((f) => ({ ...f, precioVenta: e.target.value }))}
              placeholder="0.00"
              className={productModalFieldClass}
              required
            />
          </label>
          <label className="min-w-0 text-xs font-semibold text-slate-600">
            Precio compra
            <input
              type="number"
              step="0.01"
              inputMode="decimal"
              value={form.precioCompra}
              onChange={(e) => setForm((f) => ({ ...f, precioCompra: e.target.value }))}
              placeholder="0.00"
              className={productModalFieldClass}
            />
          </label>

          {/* Categoría y Proveedor */}
          <label className="min-w-0 text-xs font-semibold text-slate-600">
            Categoría
            <select
              value={form.categoriaProductoId}
              onChange={(e) => setForm((f) => ({ ...f, categoriaProductoId: e.target.value }))}
              className={productModalFieldClass}
              required
            >
              <option value="">Selecciona categoría</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre || c.descripcion || `Categoría ${c.id}`}
                </option>
              ))}
            </select>
          </label>
          <label className="min-w-0 text-xs font-semibold text-slate-600">
            Proveedor
            <select
              value={form.proveedorId}
              onChange={(e) => setForm((f) => ({ ...f, proveedorId: e.target.value }))}
              className={productModalFieldClass}
            >
              <option value="">Sin proveedor</option>
              {providers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre || p.descripcion || `Proveedor ${p.id}`}
                </option>
              ))}
            </select>
          </label>

          {/* Checkboxes de control (Controlar stock primero: define si se muestran cantidades / talla para variante) */}
          <div className="col-span-full grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 sm:col-span-2">
            <div className="space-y-1">
              <label className="flex min-h-[44px] items-center gap-3 text-sm font-medium text-slate-700 sm:min-h-0">
                <input
                  type="checkbox"
                  className="h-5 w-5 shrink-0 rounded border-slate-300 sm:h-4 sm:w-4"
                  checked={form.controlarStock}
                  onChange={(e) => setForm((f) => ({ ...f, controlarStock: e.target.checked }))}
                />
                Controlar stock
              </label>
              {!form.controlarStock && (
                <p className="text-[11px] leading-snug text-slate-500">
                  Sin inventario: la venta no descuenta existencias (ej. pieza única o servicio).
                </p>
              )}
            </div>
            <label className="flex min-h-[44px] items-center gap-3 text-sm text-slate-700 sm:min-h-0">
              <input
                type="checkbox"
                className="h-5 w-5 shrink-0 rounded border-slate-300 sm:h-4 sm:w-4"
                checked={form.activo}
                onChange={(e) => setForm((f) => ({ ...f, activo: e.target.checked }))}
              />
              Activo
            </label>
          </div>

          {/* Stocks y talla (solo con control de inventario; talla opcional para variante inicial en servidor) */}
          {form.controlarStock && (
            <>
              <label className="min-w-0 text-xs font-semibold text-slate-600">
                Stock actual
                <input
                  type="number"
                  inputMode="numeric"
                  value={form.stock}
                  onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                  placeholder="Stock"
                  className={`${productModalFieldClass} ${productModalInputLockedClass}`}
                  disabled={Boolean(form.id)}
                  title={form.id ? "El stock se ajusta desde movimientos de inventario." : undefined}
                />
              </label>
              <label className="min-w-0 text-xs font-semibold text-slate-600">
                Stock mínimo
                <input
                  type="number"
                  inputMode="numeric"
                  value={form.stockMinimo}
                  onChange={(e) => setForm((f) => ({ ...f, stockMinimo: e.target.value }))}
                  placeholder="0"
                  className={productModalFieldClass}
                />
              </label>
              <label className="min-w-0 text-xs font-semibold text-slate-600 sm:col-span-2">
                Talla (opcional)
                <input
                  value={form.talla}
                  onChange={(e) => setForm((f) => ({ ...f, talla: e.target.value }))}
                  placeholder="Ej: L, 42, M — ayuda a crear la variante inicial"
                  className={productModalFieldClass}
                  autoComplete="off"
                />
              </label>
            </>
          )}

          {/* Descripción */}
          <div className="col-span-full">
            <label className="min-w-0 text-xs font-bold text-slate-600 uppercase tracking-widest">
              Descripción
              <textarea
                value={form.descripcion}
                onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                placeholder="Tela, estilo..."
                className={productModalTextareaClass}
                rows="1"
              />
            </label>
          </div>

          {/* Imagen del Producto (Al final) */}
          <div className="col-span-full mt-2">
            <p className="mb-2 text-xs font-bold text-slate-600 uppercase tracking-widest">
              Foto del Producto
            </p>
            {!form.imagen ? (
              <label className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 transition-all hover:bg-blue-50 hover:border-blue-300">
                <Upload className="h-6 w-6 text-slate-400" />
                <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Seleccionar Imagen</p>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const base64 = await fileToBase64(file);
                      setForm((f) => ({ ...f, imagen: base64 }));
                    }
                  }}
                />
              </label>
            ) : (
              <div className="relative h-40 w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                <img src={form.imagen} alt="Preview" className="h-full w-full object-contain p-2" />
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, imagen: "" }))}
                  className="absolute right-3 top-3 rounded-full bg-white/90 p-2 text-red-500 shadow-xl border border-slate-100 transition-transform hover:scale-110"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Acciones del Modal */}
        <div className={cn(modalFormFooterClass, "mt-8 gap-3")}>
          <button
            type="button"
            disabled={saving}
            onClick={() => setModalOpen(false)}
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-300 px-6 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 sm:min-h-0 sm:py-2"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving || !isOnline}
            title={offlineButtonTitle(isOnline)}
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-primary-600 px-8 text-sm font-bold text-white shadow-lg shadow-primary-200 hover:bg-primary-700 disabled:opacity-50 sm:min-h-0 sm:py-2"
          >
            {saving ? "Guardando..." : "Guardar Producto"}
          </button>
        </div>
      </form>
    </BackofficeDialog>
  );
}
