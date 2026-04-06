import { useEffect, useState } from "react";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Search,
  Tag,
  ChevronRight
} from "lucide-react";
import { backofficeApi } from "../services/backofficeApi.js";
import { useSnackbar } from "../../../contexts/SnackbarContext.jsx";
import { ConfirmModal } from "../../../components/ui/ConfirmModal.jsx";
import { BackofficeDialog } from "../components/index.js";

export function CategoriesView() {
  const snackbar = useSnackbar();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState({
    id: null,
    nombre: "",
    descripcion: "",
    activo: true
  });

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await backofficeApi.catalogoCategorias();
      setCategories(Array.isArray(data) ? data : data?.items || []);
    } catch (e) {
      snackbar.error("Error al cargar categorías.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const filteredCategories = categories.filter(c => 
    c.nombre?.toLowerCase().includes(search.toLowerCase()) ||
    c.descripcion?.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setForm({ id: null, nombre: "", descripcion: "", activo: true });
    setModalOpen(true);
  };

  const openEdit = (cat) => {
    setForm({
      id: cat.id,
      nombre: cat.nombre || "",
      descripcion: cat.descripcion || "",
      activo: cat.activo !== false
    });
    setModalOpen(true);
  };

  const saveCategory = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        nombre: form.nombre,
        descripcion: form.descripcion,
        activo: form.activo
      };
      
      if (form.id) {
        await backofficeApi.updateCategoria(form.id, body);
        snackbar.success("Categoría actualizada.");
      } else {
        await backofficeApi.createCategoria(body);
        snackbar.success("Categoría creada.");
      }
      setModalOpen(false);
      loadCategories();
    } catch (e) {
      snackbar.error("Error al guardar categoría.");
    } finally {
      setSaving(false);
    }
  };

  const deleteCategory = async () => {
    if (!confirmDelete.id) return;
    try {
      await backofficeApi.deleteCategoria(confirmDelete.id);
      snackbar.success("Categoría eliminada.");
      setConfirmDelete({ open: false, id: null });
      loadCategories();
    } catch (e) {
      snackbar.error("No se pudo eliminar la categoría.");
    }
  };

  return (
    <div className="space-y-4">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar categorías..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none shadow-sm"
          />
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-blue-100 hover:bg-blue-700 transition active:scale-95"
        >
          <Plus className="h-5 w-5" />
          Nueva Categoría
        </button>
      </section>

      <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4">Nombre / Descripción</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="animate-pulse border-b border-slate-100">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-slate-200"></div>
                        <div className="space-y-2">
                          <div className="h-4 w-32 rounded bg-slate-200"></div>
                          <div className="h-3 w-48 rounded bg-slate-200"></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><div className="h-5 w-16 rounded-full bg-slate-200"></div></td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <div className="h-9 w-9 rounded-lg bg-slate-200"></div>
                        <div className="h-9 w-9 rounded-lg bg-slate-200"></div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan="3" className="px-6 py-12 text-center text-slate-400">No se encontraron categorías.</td>
                </tr>
              ) : (
                filteredCategories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                          <Tag className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{cat.nombre}</p>
                          <p className="text-xs text-slate-500 line-clamp-1">{cat.descripcion || 'Sin descripción'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${cat.activo ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                        {cat.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEdit(cat)}
                          className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 active:scale-95"
                          title="Editar"
                        >
                          <Pencil className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => setConfirmDelete({ open: true, id: cat.id })}
                          className="rounded-lg border border-red-100 p-2 text-red-600 hover:bg-red-50 active:scale-95"
                          title="Eliminar"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </article>

      <BackofficeDialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={form.id ? "Editar Categoría" : "Nueva Categoría"}
      >
        <form onSubmit={saveCategory} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Nombre</label>
            <input
              required
              type="text"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:border-blue-500 focus:bg-white focus:outline-none"
              placeholder="Ej: Ropa, Calzado..."
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Descripción</label>
            <textarea
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:border-blue-500 focus:bg-white focus:outline-none"
              rows="3"
              placeholder="Opcional..."
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="cat-activo"
              checked={form.activo}
              onChange={(e) => setForm({ ...form, activo: e.target.checked })}
              className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="cat-activo" className="text-sm font-medium text-slate-700">Categoría activa</label>
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-xl px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-blue-600 px-6 py-2 text-sm font-bold text-white shadow-lg shadow-blue-100 hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </BackofficeDialog>

      <ConfirmModal
        open={confirmDelete.open}
        onClose={() => setConfirmDelete({ open: false, id: null })}
        onConfirm={deleteCategory}
        title="¿Eliminar Categoría?"
        description="Esta acción marcará la categoría como inactiva o la eliminará. Los productos asociados no se eliminarán pero podrían quedar sin categoría."
      />
    </div>
  );
}
