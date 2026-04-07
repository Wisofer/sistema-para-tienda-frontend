import { useState } from "react";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { BackofficePageShell, BackofficeListSkeletonLoading, BackofficeDialog } from "../components/index.js";
import { useClients } from "../../../hooks/useClients.js";
import { PAGINATION } from "../constants/pagination.js";
import { useSnackbar } from "../../../contexts/SnackbarContext.jsx";
import { useOnlineStatus } from "../../../hooks/useOnlineStatus.js";
import { NETWORK_UI, offlineButtonTitle } from "../../../constants/networkUi.js";
import { ConfirmModal } from "../../../components/ui/ConfirmModal.jsx";

function rowDisplay(c) {
  return {
    id: c?.id,
    nombre: c?.nombre ?? c?.nombreCompleto ?? "—",
    ruc: c?.ruc ?? c?.cedula ?? c?.documento ?? "—",
    telefono: c?.telefono ?? c?.telefonoMovil ?? "—",
    email: c?.email ?? c?.correo ?? "",
    raw: c,
  };
}

const emptyForm = () => ({
  id: null,
  nombre: "",
  ruc: "",
  telefono: "",
  email: "",
});

export function ClientsView() {
  const snackbar = useSnackbar();
  const isOnline = useOnlineStatus();
  const [searchInput, setSearchInput] = useState("");
  const [filterSearch, setFilterSearch] = useState("");
  const { clients, loading, error, totalPages, page, setPage, refetch, create, update, remove } = useClients(
    filterSearch,
    PAGINATION.LIST_DEFAULT
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, row: null });

  const applyFilters = () => {
    setFilterSearch(searchInput.trim());
    setPage(1);
  };

  const openCreate = () => {
    setForm(emptyForm());
    setModalOpen(true);
  };

  const openEdit = (row) => {
    const r = row.raw ?? row;
    setForm({
      id: r.id,
      nombre: String(r.nombre ?? r.nombreCompleto ?? "").trim(),
      ruc: String(r.ruc ?? r.cedula ?? r.documento ?? "").trim(),
      telefono: String(r.telefono ?? r.telefonoMovil ?? "").trim(),
      email: String(r.email ?? r.correo ?? "").trim(),
    });
    setModalOpen(true);
  };

  const saveCliente = async (e) => {
    e.preventDefault();
    if (!isOnline) {
      snackbar.error(NETWORK_UI.snackbarGuardar);
      return;
    }
    const nombre = form.nombre.trim();
    if (!nombre) {
      snackbar.error("El nombre es obligatorio.");
      return;
    }
    setSaving(true);
    try {
      const body = {
        nombre,
        nombreCompleto: nombre,
        ruc: form.ruc.trim() || undefined,
        cedula: form.ruc.trim() || undefined,
        telefono: form.telefono.trim() || undefined,
        email: form.email.trim() || undefined,
      };
      if (form.id) {
        await update(form.id, body);
        snackbar.success("Cliente actualizado.");
      } else {
        await create(body);
        snackbar.success("Cliente creado.");
      }
      setModalOpen(false);
      await refetch();
    } catch (err) {
      snackbar.error(err.message || "No se pudo guardar el cliente.");
    } finally {
      setSaving(false);
    }
  };

  const rows = clients.map(rowDisplay);

  return (
    <BackofficePageShell maxWidth="7xl" className="space-y-4">
      {error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          No se pudo cargar la lista desde el servidor: {error}.{" "}
          <button type="button" className="font-semibold underline" onClick={() => refetch()}>
            Reintentar
          </button>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o RUC..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            className="w-full rounded-xl border border-slate-200 py-2 pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={applyFilters}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Filtrar
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
          >
            <Plus className="h-5 w-5" />
            Nuevo Cliente
          </button>
        </div>
      </div>

      {loading ? (
        <BackofficeListSkeletonLoading rows={8} maxWidth="7xl" />
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {/* Móvil: tarjetas */}
          <div className="md:hidden divide-y divide-slate-100">
            {rows.length === 0 && (
              <p className="px-4 py-10 text-center text-sm text-slate-500">No hay clientes que coincidan.</p>
            )}
            {rows.map((c) => (
              <article
                key={c.id ?? `${c.nombre}-${c.ruc}`}
                className="flex gap-3 p-4 hover:bg-slate-50/80"
              >
                <div className="min-w-0 flex-1 space-y-1.5">
                  <p className="font-semibold leading-snug text-slate-900">{c.nombre}</p>
                  <dl className="grid grid-cols-1 gap-1 text-xs text-slate-600 sm:grid-cols-2">
                    <div>
                      <dt className="text-slate-400">RUC / Cédula</dt>
                      <dd className="font-medium text-slate-700">{c.ruc}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Teléfono</dt>
                      <dd className="font-medium text-slate-700">{c.telefono}</dd>
                    </div>
                    {c.email ? (
                      <div className="col-span-1 min-w-0 sm:col-span-2">
                        <dt className="text-slate-400">Email</dt>
                        <dd className="truncate font-medium text-slate-700">{c.email}</dd>
                      </div>
                    ) : null}
                  </dl>
                </div>
                <div className="flex shrink-0 flex-col gap-1">
                  <button
                    type="button"
                    title="Editar"
                    onClick={() => openEdit(c)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-primary-50 hover:text-primary-600"
                  >
                    <Pencil className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    title="Eliminar"
                    onClick={() => setConfirmDelete({ open: true, row: c })}
                    className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </article>
            ))}
          </div>

          {/* Tablet/desktop: tabla con scroll horizontal de respaldo */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold lg:px-6">Nombre</th>
                  <th className="px-4 py-3 font-semibold lg:px-6">RUC / Cédula</th>
                  <th className="px-4 py-3 font-semibold lg:px-6">Teléfono</th>
                  <th className="px-4 py-3 font-semibold lg:px-6">Email</th>
                  <th className="px-4 py-3 text-right font-semibold lg:px-6">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      No hay clientes que coincidan.
                    </td>
                  </tr>
                )}
                {rows.map((c) => (
                  <tr key={c.id ?? `${c.nombre}-${c.ruc}`} className="transition-colors hover:bg-slate-50/50">
                    <td className="px-4 py-4 font-medium text-slate-800 lg:px-6">{c.nombre}</td>
                    <td className="px-4 py-4 text-slate-600 lg:px-6">{c.ruc}</td>
                    <td className="px-4 py-4 text-slate-600 lg:px-6">{c.telefono}</td>
                    <td className="px-4 py-4 text-slate-600 lg:px-6">{c.email || "—"}</td>
                    <td className="px-4 py-4 text-right lg:px-6">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          title="Editar"
                          onClick={() => openEdit(c)}
                          className="rounded-lg p-1 text-slate-400 hover:bg-primary-50 hover:text-primary-600"
                        >
                          <Pencil className="h-5 w-5" />
                        </button>
                        <button
                          type="button"
                          title="Eliminar"
                          onClick={() => setConfirmDelete({ open: true, row: c })}
                          className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-4 py-3">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-50"
              >
                Anterior
              </button>
              <span className="text-xs text-slate-500">
                Página {page} de {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      )}

      {modalOpen && (
        <BackofficeDialog maxWidthClass="max-w-md" onBackdropClick={saving ? undefined : () => setModalOpen(false)}>
          <form onSubmit={saveCliente} className="flex w-full min-w-0 flex-col">
            <h3 className="shrink-0 text-lg font-semibold text-slate-800">
              {form.id ? "Editar cliente" : "Nuevo cliente"}
            </h3>
            <div className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch] pb-1">
              <input
                name="nombre"
                autoComplete="name"
                enterKeyHint="next"
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                placeholder="Nombre *"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base text-slate-900 sm:text-sm"
                required
              />
              <input
                name="ruc"
                autoComplete="off"
                enterKeyHint="next"
                value={form.ruc}
                onChange={(e) => setForm((f) => ({ ...f, ruc: e.target.value }))}
                placeholder="RUC / Cédula"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base text-slate-900 sm:text-sm"
              />
              <input
                name="telefono"
                type="tel"
                autoComplete="tel"
                enterKeyHint="next"
                inputMode="tel"
                value={form.telefono}
                onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
                placeholder="Teléfono"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base text-slate-900 sm:text-sm"
              />
              <input
                name="email"
                type="email"
                autoComplete="email"
                enterKeyHint="done"
                inputMode="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="Email"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base text-slate-900 sm:text-sm"
              />
            </div>
            <div className="mt-4 flex shrink-0 flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-600">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving || !isOnline}
                title={offlineButtonTitle(isOnline)}
                className="rounded-lg bg-primary-600 px-3 py-2.5 text-xs font-semibold text-white disabled:opacity-50"
              >
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </form>
        </BackofficeDialog>
      )}

      <ConfirmModal
        open={confirmDelete.open}
        onClose={() => setConfirmDelete({ open: false, row: null })}
        onConfirm={async () => {
          const r = confirmDelete.row;
          if (!r?.id) return;
          setSaving(true);
          try {
            await remove(r.id);
            snackbar.success("Cliente eliminado.");
            setConfirmDelete({ open: false, row: null });
            await refetch();
          } catch (err) {
            snackbar.error(err.message || "No se pudo eliminar.");
          } finally {
            setSaving(false);
          }
        }}
        title="Eliminar cliente"
        message={confirmDelete.row ? `¿Eliminar a "${confirmDelete.row.nombre}"?` : "¿Eliminar cliente?"}
        confirmLabel="Eliminar"
        variant="danger"
        loading={saving}
      />
    </BackofficePageShell>
  );
}
