import { useState, useEffect } from "react";
import { Users, Plus, Search, Pencil, Trash2 } from "lucide-react";

export function ClientsView() {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("pos-clients");
    if (saved) setClients(JSON.parse(saved));
    else setClients([
      { id: 1, nombre: "Consumidor Final", ruc: "000-000000-0000", telefono: "0000-0000" }
    ]);
  }, []);

  const filtered = clients.filter(c => 
    c.nombre.toLowerCase().includes(search.toLowerCase()) || 
    c.ruc.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o RUC..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 py-2 pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none"
          />
        </div>
        <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700">
          <Plus className="h-5 w-5" />
          Nuevo Cliente
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-6 py-3 font-semibold">Nombre</th>
              <th className="px-6 py-3 font-semibold">RUC / Cédula</th>
              <th className="px-6 py-3 font-semibold">Teléfono</th>
              <th className="px-6 py-3 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-800">{c.nombre}</td>
                <td className="px-6 py-4 text-slate-600">{c.ruc}</td>
                <td className="px-6 py-4 text-slate-600">{c.telefono}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button className="p-1 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50">
                      <Pencil className="h-5 w-5" />
                    </button>
                    <button className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50">
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
