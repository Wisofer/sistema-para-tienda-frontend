import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Pencil, Plus, PowerOff, Trash2 } from "lucide-react";
import { backofficeApi } from "../services/backofficeApi.js";
import { BackofficeDialog, BackofficeListSkeletonLoading, BackofficePageShell } from "../components/index.js";
import { useSnackbar } from "../../../contexts/SnackbarContext.jsx";
import { ConfirmModal } from "../../../components/ui/ConfirmModal.jsx";
import { PAGINATION } from "../constants/pagination.js";
import {
  aggregateProductCountsByCategoryId,
  fetchAllProductPages,
} from "../utils/inventoryUtils.js";

function formatCatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-NI", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/**
 * Gestión de categorías (paridad UX con BarResPos ProductCategoriesView):
 * conteos en cliente, navegación a productos solo desde nombre y columna Productos.
 */
export function CategoriesView({
  onBackToProducts,
  onOpenProducts,
  onCategoriesMutated,
}) {
  const snackbar = useSnackbar();
  const [categories, setCategories] = useState([]);
  const [countsByCatId, setCountsByCatId] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    id: null,
    nombre: "",
    descripcion: "",
    activo: true,
  });
  const [confirmAction, setConfirmAction] = useState({ open: false, type: "", id: null, name: "" });

  const canOpenProducts = typeof onOpenProducts === "function";

  const reload = useCallback(async () => {
    setError("");
    const [cat, items] = await Promise.all([
      backofficeApi.catalogoCategoriasProducto(),
      fetchAllProductPages(
        (params) => backofficeApi.listProductos(params),
        { activos: true },
        { pageSize: PAGINATION.PRODUCTOS_ADMIN }
      ),
    ]);
    const list = Array.isArray(cat) ? cat : cat?.items || [];
    setCategories(list);
    setCountsByCatId(aggregateProductCountsByCategoryId(items));
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await reload();
      } catch (e) {
        if (mounted) setError(e.message || "No se pudo cargar categorías.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [reload]);

  const rows = useMemo(() => {
    return categories.map((c, idx) => {
      const id = c.id ?? c.Id;
      const count = countsByCatId[String(id)] ?? 0;
      const activo = (c.activo ?? c.Activo) !== false;
      const created = c.fechaCreacion ?? c.FechaCreacion ?? c.createdAt ?? c.CreatedAt ?? null;
      return { c, idx, id, count, activo, created };
    });
  }, [categories, countsByCatId]);

  const openCreate = () => {
    setForm({ id: null, nombre: "", descripcion: "", activo: true });
    setModalOpen(true);
  };

  const openEdit = async (id) => {
    setSaving(true);
    setError("");
    try {
      const raw = await backofficeApi.getCategoriaProducto(id);
      setForm({
        id: raw.id ?? raw.Id ?? id,
        nombre: raw.nombre || raw.Nombre || "",
        descripcion: raw.descripcion ?? raw.Descripcion ?? "",
        activo: (raw.activo ?? raw.Activo) !== false,
      });
      setModalOpen(true);
    } catch (e) {
      snackbar.error(e.message || "No se pudo cargar la categoría.");
    } finally {
      setSaving(false);
    }
  };

  const saveCategory = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const body = {
        nombre: form.nombre,
        descripcion: form.descripcion?.trim() ? form.descripcion : null,
        activo: Boolean(form.activo),
      };
      if (form.id) await backofficeApi.updateCategoria(form.id, body);
      else await backofficeApi.createCategoria(body);
      await reload();
      onCategoriesMutated?.();
      setModalOpen(false);
      snackbar.success("Categoría guardada.");
    } catch (e2) {
      snackbar.error(e2.message || "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  };

  const deactivateCategory = async (id) => {
    setSaving(true);
    setError("");
    try {
      const c = await backofficeApi.getCategoriaProducto(id);
      await backofficeApi.updateCategoria(id, {
        nombre: c.nombre || c.Nombre || "",
        descripcion: c.descripcion ?? c.Descripcion ?? null,
        activo: false,
      });
      await reload();
      onCategoriesMutated?.();
      snackbar.success("Categoría desactivada.");
    } catch (e) {
      snackbar.error(e.message || "No se pudo desactivar.");
    } finally {
      setSaving(false);
    }
  };

  const deleteCategory = async (id) => {
    setSaving(true);
    setError("");
    try {
      await backofficeApi.deleteCategoria(id);
      await reload();
      onCategoriesMutated?.();
      snackbar.success("Categoría eliminada.");
    } catch (e) {
      snackbar.error(e.message || "No se pudo eliminar.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <BackofficeListSkeletonLoading rows={8} maxWidth="7xl" />;
  }

  return (
    <BackofficePageShell maxWidth="7xl" className="space-y-4">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-800">Categorías de producto</h2>
            <p className="text-xs text-slate-500">
              Gestiona categorías; el catálogo de productos sigue en la vista de inventario.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {typeof onBackToProducts === "function" && (
              <button
                type="button"
                onClick={onBackToProducts}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Volver al catálogo
              </button>
            )}
            {canOpenProducts && (
              <button
                type="button"
                onClick={() => onOpenProducts("")}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Ver todos los productos
              </button>
            )}
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-1 rounded-lg bg-primary-600 px-3 py-2 text-xs font-semibold text-white hover:bg-primary-700"
            >
              <Plus className="h-3.5 w-3.5" />
              Nueva categoría
            </button>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Móvil: tarjetas */}
        <div className="space-y-3 p-3 md:hidden">
          {rows.length === 0 && (
            <p className="rounded-xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-500">
              No hay categorías. Crea una con «Nueva categoría».
            </p>
          )}
          {rows.map(({ c, idx, id, count, activo, created }) => (
            <article
              key={id}
              className={`rounded-xl border border-slate-200 p-4 ${activo ? "bg-white" : "bg-slate-50/90"}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate-400">#{idx + 1}</p>
                  {canOpenProducts ? (
                    <button
                      type="button"
                      onClick={() => onOpenProducts(String(id))}
                      className="mt-0.5 text-left text-base font-semibold text-primary-700 hover:underline"
                    >
                      {c.nombre || `Categoría ${id}`}
                    </button>
                  ) : (
                    <p className="mt-0.5 text-base font-semibold text-slate-900">{c.nombre || `Categoría ${id}`}</p>
                  )}
                  <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-slate-600">{c.descripcion || "—"}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    {canOpenProducts ? (
                      <button
                        type="button"
                        onClick={() => onOpenProducts(String(id))}
                        className="font-semibold text-primary-700 hover:underline"
                      >
                        {count} producto{count === 1 ? "" : "s"}
                      </button>
                    ) : (
                      <span className="text-slate-700">
                        {count} producto{count === 1 ? "" : "s"}
                      </span>
                    )}
                    <span className="text-slate-300">·</span>
                    <span className="text-slate-500">Alta {formatCatDate(created)}</span>
                  </div>
                  <div className="mt-2">
                    {activo ? (
                      <span className="inline-flex rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                        Activa
                      </span>
                    ) : (
                      <span className="inline-flex rounded-md bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-700">
                        Inactiva
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col gap-1">
                  <button
                    type="button"
                    title="Editar"
                    aria-label="Editar categoría"
                    onClick={() => openEdit(id)}
                    disabled={saving}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  {activo && (
                    <button
                      type="button"
                      title="Desactivar"
                      aria-label="Desactivar categoría"
                      onClick={() => setConfirmAction({ open: true, type: "deactivate", id, name: c.nombre || "" })}
                      disabled={saving}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-amber-200 text-amber-800 hover:bg-amber-50 disabled:opacity-50"
                    >
                      <PowerOff className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    title="Eliminar"
                    aria-label="Eliminar categoría"
                    onClick={() => setConfirmAction({ open: true, type: "delete", id, name: c.nombre || "" })}
                    disabled={saving}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Desktop: tabla */}
        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-[900px] w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Descripción</th>
                <th className="px-4 py-3">Productos</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Fecha creación</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No hay categorías. Crea una con «Nueva categoría».
                  </td>
                </tr>
              )}
              {rows.map(({ c, idx, id, count, activo, created }) => (
                <tr key={id} className={activo ? "bg-white" : "bg-slate-50/80"}>
                  <td className="px-4 py-3 text-slate-500">{idx + 1}</td>
                  <td className="px-4 py-3">
                    {canOpenProducts ? (
                      <button
                        type="button"
                        onClick={() => onOpenProducts(String(id))}
                        className="text-left font-semibold text-primary-700 hover:underline"
                      >
                        {c.nombre || `Categoría ${id}`}
                      </button>
                    ) : (
                      <span className="font-semibold text-slate-800">{c.nombre || `Categoría ${id}`}</span>
                    )}
                  </td>
                  <td className="max-w-[220px] px-4 py-3 text-slate-600">
                    <span className="line-clamp-2">{c.descripcion || "—"}</span>
                  </td>
                  <td className="px-4 py-3">
                    {canOpenProducts ? (
                      <button
                        type="button"
                        onClick={() => onOpenProducts(String(id))}
                        className="text-primary-700 hover:underline"
                      >
                        {count} producto{count === 1 ? "" : "s"}
                      </button>
                    ) : (
                      <span className="text-slate-700">
                        {count} producto{count === 1 ? "" : "s"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {activo ? (
                      <span className="inline-flex rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                        Activa
                      </span>
                    ) : (
                      <span className="inline-flex rounded-md bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-700">
                        Inactiva
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{formatCatDate(created)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        title="Editar"
                        aria-label="Editar categoría"
                        onClick={() => openEdit(id)}
                        disabled={saving}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      {activo && (
                        <button
                          type="button"
                          title="Desactivar"
                          aria-label="Desactivar categoría"
                          onClick={() =>
                            setConfirmAction({ open: true, type: "deactivate", id, name: c.nombre || "" })
                          }
                          disabled={saving}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-amber-200 text-amber-800 hover:bg-amber-50 disabled:opacity-50"
                        >
                          <PowerOff className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        title="Eliminar"
                        aria-label="Eliminar categoría"
                        onClick={() =>
                          setConfirmAction({ open: true, type: "delete", id, name: c.nombre || "" })
                        }
                        disabled={saving}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <BackofficeDialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onBackdropClick={saving ? undefined : () => setModalOpen(false)}
        maxWidthClass="max-w-lg"
      >
        <form onSubmit={saveCategory} className="flex w-full min-w-0 flex-col">
          <h3 className="shrink-0 text-lg font-semibold text-slate-800">
            {form.id ? "Editar categoría" : "Nueva categoría"}
          </h3>
          <div className="mt-4 min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch] pb-1">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Nombre</label>
              <input
                required
                name="nombre"
                type="text"
                autoComplete="off"
                enterKeyHint="next"
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-base text-slate-900 focus:border-primary-500 focus:outline-none sm:py-2 sm:text-sm"
                placeholder="Ej: Ropa, Calzado..."
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Descripción</label>
              <textarea
                name="descripcion"
                value={form.descripcion}
                onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-base text-slate-900 focus:border-primary-500 focus:outline-none sm:py-2 sm:text-sm"
                rows={4}
                placeholder="Opcional..."
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="cat-activo"
                checked={form.activo}
                onChange={(e) => setForm((f) => ({ ...f, activo: e.target.checked }))}
                className="h-5 w-5 shrink-0 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="cat-activo" className="text-sm font-medium text-slate-700">
                Categoría activa
              </label>
            </div>
          </div>
          <div className="mt-4 flex shrink-0 flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              disabled={saving}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 sm:w-auto"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-primary-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 disabled:opacity-50 sm:w-auto"
            >
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </BackofficeDialog>

      <ConfirmModal
        open={confirmAction.open}
        onClose={() => setConfirmAction({ open: false, type: "", id: null, name: "" })}
        onConfirm={async () => {
          if (confirmAction.type === "deactivate" && confirmAction.id) await deactivateCategory(confirmAction.id);
          if (confirmAction.type === "delete" && confirmAction.id) await deleteCategory(confirmAction.id);
        }}
        title={confirmAction.type === "delete" ? "Eliminar categoría" : "Desactivar categoría"}
        message={
          confirmAction.type === "delete"
            ? `¿Eliminar la categoría "${confirmAction.name}"? Si tiene productos asociados, el servidor puede rechazar la operación.`
            : `¿Desactivar la categoría "${confirmAction.name}"? Podrás reactivarla editándola y marcando como activa.`
        }
        confirmLabel={confirmAction.type === "delete" ? "Eliminar" : "Desactivar"}
        variant="danger"
        loading={saving}
      />
    </BackofficePageShell>
  );
}
