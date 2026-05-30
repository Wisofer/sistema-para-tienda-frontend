import { useEffect, useState } from "react";
import { DollarSign, KeyRound, Pencil, Trash2, ShieldCheck, Sliders, MessageSquare, RefreshCw, Settings, Plus } from "lucide-react";
import { backofficeApi } from "../services/backofficeApi.js";
import { BackofficeDialog, BackofficeListSkeletonLoading, BackofficePageShell } from "../components/index.js";
import { useAuth } from "../../../contexts/AuthContext.jsx";
import { useSnackbar } from "../../../contexts/SnackbarContext.jsx";
import { ConfirmModal } from "../../../components/ui/ConfirmModal.jsx";
import {
  modalFormBodyScrollClass,
  modalFormFooterClass,
  modalFormRootClass,
} from "../utils/modalResponsiveClasses.js";
import { POS_EXCHANGE_RATE_UPDATED_EVENT } from "../constants/posEvents.js";
import { tipoCambioInputTextFromApi } from "../utils/currency.js";

async function persistTipoCambioServidor(n) {
  if (!Number.isFinite(n) || n <= 0) return;
  await backofficeApi.updateTipoCambio(n);
  window.dispatchEvent(new CustomEvent(POS_EXCHANGE_RATE_UPDATED_EVENT));
}

const CODIGO_CANCELACION_KEY = "CodigoCancelacionVenta";

function findConfigValueByKey(settings, keys) {
  const list = Array.isArray(settings) ? settings : [];
  const wanted = new Set(keys.map((k) => String(k).trim().toLowerCase()));
  for (const cfg of list) {
    const key = String(cfg?.clave ?? cfg?.Clave ?? "").trim().toLowerCase();
    if (!key || !wanted.has(key)) continue;
    const value = cfg?.valor ?? cfg?.Valor;
    return value != null ? String(value) : "";
  }
  return "";
}

async function persistCodigoCancelacionServidor(code) {
  const raw = String(code ?? "").trim();
  if (!raw) throw new Error("Ingresa el código de devolución/cancelación.");
  await backofficeApi.upsertConfiguracion(
    CODIGO_CANCELACION_KEY,
    raw,
    "Código/PIN para cancelación o devolución de ventas"
  );
}

async function fetchCodigoCancelacionWithFallback(list) {
  const fromList = findConfigValueByKey(list, [
    "CodigoCancelacionVenta",
    "codigoCancelacionVenta",
    "CodigoDevolucionVenta",
    "codigoDevolucionVenta",
  ]);
  if (fromList) return fromList;
  try {
    const cfg = await backofficeApi.configuracionPorClave(CODIGO_CANCELACION_KEY);
    const v = cfg?.valor ?? cfg?.Valor ?? cfg?.data?.valor ?? cfg?.data?.Valor;
    return v != null ? String(v) : "";
  } catch {
    return "";
  }
}

export function SettingsView() {
  const { user } = useAuth();
  const snackbar = useSnackbar();
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [configForm, setConfigForm] = useState({ clave: "", valor: "", descripcion: "" });
  const [templates, setTemplates] = useState([]);
  const [templatesActivas, setTemplatesActivas] = useState("");
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    id: null,
    nombre: "",
    contenido: "",
    activa: true,
    predeterminada: false,
  });
  const [alertasStockMinimo, setAlertasStockMinimo] = useState(true);
  const [sonidosNotificacion, setSonidosNotificacion] = useState(true);
  const [confirmDeleteTemplate, setConfirmDeleteTemplate] = useState({ open: false, id: null });
  /** Valor editado del tipo de cambio USD→C$ (mismo endpoint que el POS). */
  const [tipoCambioInput, setTipoCambioInput] = useState(() => tipoCambioInputTextFromApi(null));
  const [codigoCancelacionInput, setCodigoCancelacionInput] = useState("");

  // Pestaña activa actual (Mac-like split screen navigation)
  const [activeTab, setActiveTab] = useState("finanzas");

  const loadAll = async () => {
    const [config, tmpl, tc] = await Promise.all([
      backofficeApi.configuraciones(),
      backofficeApi.listPlantillasWhatsapp(templatesActivas === "" ? {} : { activas: templatesActivas }),
      backofficeApi.configuracionTipoCambio().catch(() => null),
    ]);
    const list = Array.isArray(config) ? config : config?.items || [];
    setSettings(list);
    setCodigoCancelacionInput(await fetchCodigoCancelacionWithFallback(list));
    setTemplates(Array.isArray(tmpl) ? tmpl : tmpl?.items || []);
    setTipoCambioInput(tipoCambioInputTextFromApi(tc));
  };

  useEffect(() => {
    let mounted = true;
    loadAll()
      .catch((e) => mounted && setError(e.message || "No se pudo cargar configuraciones."))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  const reloadTemplates = async (activas = templatesActivas) => {
    const data = await backofficeApi.listPlantillasWhatsapp(activas === "" ? {} : { activas });
    setTemplates(Array.isArray(data) ? data : data?.items || []);
  };

  const openConfigEditor = (cfg) => {
    setConfigForm({
      clave: cfg?.clave || "",
      valor: cfg?.valor != null ? String(cfg.valor) : "",
      descripcion: cfg?.descripcion || "",
    });
    setModalOpen(true);
  };

  const saveConfig = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await backofficeApi.upsertConfiguracion(configForm.clave, configForm.valor, configForm.descripcion);
      const claveNorm = String(configForm.clave || "").trim().toLowerCase();
      if (claveNorm === "tipocambiodolar") {
        const n = Number(String(configForm.valor).replace(",", "."));
        await persistTipoCambioServidor(n).catch(() => {});
      }
      await loadAll();
      setModalOpen(false);
      snackbar.success("Configuración guardada.");
    } catch (e2) {
      snackbar.error(e2.message || "No se pudo guardar la configuración.");
    } finally {
      setSaving(false);
    }
  };

  const openTemplateCreate = () => {
    setTemplateForm({
      id: null,
      nombre: "",
      contenido: "",
      activa: true,
      predeterminada: false,
    });
    setTemplateModalOpen(true);
  };

  const openTemplateEdit = async (id) => {
    setSaving(true);
    setError("");
    try {
      const t = await backofficeApi.getPlantillaWhatsapp(id);
      setTemplateForm({
        id: t.id,
        nombre: t.nombre || "",
        contenido: t.contenido || t.mensaje || "",
        activa: t.activa !== false,
        predeterminada: Boolean(t.predeterminada || t.esDefault),
      });
      setTemplateModalOpen(true);
    } catch (e) {
      setError(e.message || "No se pudo cargar plantilla.");
    } finally {
      setSaving(false);
    }
  };

  const saveTemplate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const body = {
        nombre: templateForm.nombre,
        contenido: templateForm.contenido,
        activa: Boolean(templateForm.activa),
      };
      let templateId = templateForm.id;
      if (templateForm.id) {
        await backofficeApi.updatePlantillaWhatsapp(templateForm.id, body);
      } else {
        const created = await backofficeApi.createPlantillaWhatsapp(body);
        templateId = created?.id || created?.plantillaId || null;
      }
      if (templateForm.predeterminada && templateId) {
        await backofficeApi.marcarDefaultPlantillaWhatsapp(templateId);
      }
      await reloadTemplates();
      setTemplateModalOpen(false);
      snackbar.success("Plantilla guardada.");
    } catch (e2) {
      snackbar.error(e2.message || "No se pudo guardar plantilla.");
    } finally {
      setSaving(false);
    }
  };

  const removeTemplate = async (id) => {
    setSaving(true);
    setError("");
    try {
      await backofficeApi.deletePlantillaWhatsapp(id);
      await reloadTemplates();
      snackbar.success("Plantilla eliminada.");
    } catch (e) {
      snackbar.error(e.message || "No se pudo eliminar plantilla.");
    } finally {
      setSaving(false);
    }
  };

  const saveTipoCambioDolar = async () => {
    const n = Number(String(tipoCambioInput).replace(",", ".").trim());
    if (!Number.isFinite(n) || n <= 0) {
      snackbar.error("Ingresa un tipo de cambio válido (mayor que 0).");
      return;
    }
    setSaving(true);
    try {
      await persistTipoCambioServidor(n);
      snackbar.success("Tipo de cambio actualizado. El POS usará este valor al cobrar en USD.");
    } catch (e) {
      snackbar.error(e.message || "No se pudo guardar el tipo de cambio.");
    } finally {
      setSaving(false);
    }
  };

  const saveCodigoCancelacion = async () => {
    const raw = String(codigoCancelacionInput ?? "").trim();
    if (!raw) {
      snackbar.error("Ingresa el código de devolución/cancelación.");
      return;
    }
    setSaving(true);
    try {
      await persistCodigoCancelacionServidor(raw);
      await loadAll();
      snackbar.success("Código de devolución/cancelación actualizado.");
    } catch (e) {
      snackbar.error(e.message || "No se pudo guardar el código de devolución/cancelación.");
    } finally {
      setSaving(false);
    }
  };

  const makeDefaultTemplate = async (id) => {
    setSaving(true);
    setError("");
    try {
      await backofficeApi.marcarDefaultPlantillaWhatsapp(id);
      await reloadTemplates();
      snackbar.success("Plantilla marcada como predeterminada.");
    } catch (e) {
      snackbar.error(e.message || "No se pudo marcar como predeterminada.");
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: "finanzas", label: "Moneda y Divisa", desc: "Tipo de cambio USD/NIO", icon: DollarSign },
    { id: "seguridad", label: "Autorizaciones", desc: "PIN de cancelaciones", icon: KeyRound },
    { id: "pos", label: "Preferencias POS", desc: "Alertas y sonidos", icon: Sliders },
    { id: "whatsapp", label: "WhatsApp Marketing", desc: "Plantillas de facturación", icon: MessageSquare },
    { id: "parametros", label: "Variables Críticas", desc: "Parámetros del sistema", icon: Settings },
  ];

  if (loading) return <BackofficeListSkeletonLoading rows={5} maxWidth="7xl" />;
  return (
    <BackofficePageShell maxWidth="7xl" className="pb-12">
      
      {/* HEADER DE BIENVENIDA */}
      <div className="mb-6 border-b border-slate-100 pb-5">
        <h1 className="text-xl font-extrabold tracking-tight text-slate-800">Ajustes Generales</h1>
        <p className="text-xs text-slate-400 mt-1">Configuración del comportamiento comercial del punto de venta.</p>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50/60 p-4 text-xs font-extrabold uppercase tracking-wider text-rose-800 animate-in fade-in duration-300">
          ⚠️ {error}
        </div>
      )}

      {/* DISPOSICIÓN MAC-LIKE PANEL DIVIDIDO */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        
        {/* COLUMNA IZQUIERDA: DOCK DE NAVEGACIÓN */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-3 shadow-inner">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 font-extrabold text-xs uppercase text-blue-600 shadow-inner">
              {user?.nombreUsuario?.[0] || user?.usuario?.[0] || "U"}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-extrabold text-slate-800 tracking-tight">{user?.nombreUsuario || user?.usuario || "Usuario"}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{user?.rol || "Administrador"}</p>
            </div>
          </div>

          <nav className="flex flex-row overflow-x-auto gap-2 lg:flex-col lg:overflow-x-visible rounded-2xl border border-slate-100 bg-white p-2 shadow-sm hide-scrollbar">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-1 items-center gap-3 px-3.5 py-3 rounded-xl text-left transition-all duration-200 shrink-0 cursor-pointer ${
                    isSelected
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/10"
                      : "bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >
                  <Icon className={`h-4.5 w-4.5 shrink-0 ${isSelected ? "text-white" : "text-slate-400"}`} />
                  <div className="hidden lg:block min-w-0">
                    <p className="text-xs font-extrabold tracking-tight leading-none">{tab.label}</p>
                    <p className={`text-[9px] mt-0.5 ${isSelected ? "text-blue-100" : "text-slate-400"}`}>{tab.desc}</p>
                  </div>
                  <span className="block lg:hidden text-xs font-extrabold">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* COLUMNA DERECHA: ESPACIO DE TRABAJO ENFOCADO */}
        <div className="lg:col-span-8 min-w-0">
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm min-h-[420px] transition-all duration-300">
            
            {/* TIPO DE CAMBIO */}
            {activeTab === "finanzas" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Tipo de Cambio Cambiario</h3>
                  <p className="text-xs font-semibold text-slate-400 mt-1">Control de la tasa de conversión para pagos recibidos en USD.</p>
                </div>
                
                <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 space-y-4 shadow-inner">
                  <div className="max-w-md">
                    <label htmlFor="tipo-cambio-usd" className="mb-2 block text-[9px] font-extrabold uppercase tracking-widest text-slate-450">
                      Tasa de conversión base (1 USD = C$)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">C$</span>
                      <input
                        id="tipo-cambio-usd"
                        type="text"
                        inputMode="decimal"
                        value={tipoCambioInput}
                        onChange={(e) => setTipoCambioInput(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-9 pr-3 text-sm font-black tabular-nums text-slate-800 focus:border-blue-500 focus:outline-none transition-all shadow-sm"
                        placeholder={tipoCambioInputTextFromApi(null)}
                        autoComplete="off"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => void saveTipoCambioDolar()}
                    disabled={saving}
                    className="rounded-xl bg-blue-600 px-5 py-3 text-xs font-extrabold uppercase tracking-widest text-white hover:bg-blue-700 active:scale-95 transition-all cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </div>
            )}

            {/* SEGURIDAD */}
            {activeTab === "seguridad" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Código de Autorización</h3>
                  <p className="text-xs font-semibold text-slate-400 mt-1">PIN confidencial para autorizar devoluciones y cancelaciones de ventas.</p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 space-y-4 shadow-inner">
                  <div className="max-w-md">
                    <label
                      htmlFor="codigo-cancelacion-venta"
                      className="mb-2 block text-[9px] font-extrabold uppercase tracking-widest text-slate-450"
                    >
                      PIN / código secreto de confirmación
                    </label>
                    <div className="relative">
                      <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                      <input
                        id="codigo-cancelacion-venta"
                        type="password"
                        autoComplete="new-password"
                        value={codigoCancelacionInput}
                        onChange={(e) => setCodigoCancelacionInput(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm font-black tracking-widest text-slate-800 focus:border-blue-500 focus:outline-none transition-all shadow-sm"
                        placeholder="••••••"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => void saveCodigoCancelacion()}
                    disabled={saving}
                    className="rounded-xl bg-blue-600 px-5 py-3 text-xs font-extrabold uppercase tracking-widest text-white hover:bg-blue-700 active:scale-95 transition-all cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    Actualizar Autorización
                  </button>
                </div>
              </div>
            )}

            {/* PREFERENCIAS POS */}
            {activeTab === "pos" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Configuración del Terminal</h3>
                  <p className="text-xs font-semibold text-slate-400 mt-1">Comportamiento acústico y alertas del punto de venta.</p>
                </div>

                <div className="divide-y divide-slate-100 rounded-2xl border border-slate-100 bg-slate-50/30 overflow-hidden shadow-inner">
                  {[
                    { label: "Alertas de Stock Mínimo", desc: "Notificar en el POS cuando un producto se agote", state: alertasStockMinimo, setter: setAlertasStockMinimo },
                    { label: "Sonidos de Notificación", desc: "Activar volumen acústico al escanear e imprimir tickets", state: sonidosNotificacion, setter: setSonidosNotificacion }
                  ].map((pref, i) => (
                    <div key={i} className="flex items-center justify-between gap-4 p-4.5 bg-white/60 hover:bg-white transition-all">
                      <div>
                        <p className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">{pref.label}</p>
                        <p className="text-[10px] font-semibold text-slate-400 mt-0.5">{pref.desc}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => pref.setter(v => !v)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${pref.state ? "bg-blue-600" : "bg-slate-200"}`}
                      >
                        <span className={`inline-block h-4.5 w-4.5 transform rounded-full bg-white transition-transform ${pref.state ? "translate-x-5.5" : "translate-x-1"}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* WHATSAPP MARKETING */}
            {activeTab === "whatsapp" && (
              <div className="space-y-5 animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">WhatsApp Facturación</h3>
                    <p className="text-xs font-semibold text-slate-400 mt-1">Mensajería y mercadeo automatizado de tickets.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={templatesActivas}
                      onChange={async (e) => {
                        const v = e.target.value;
                        setTemplatesActivas(v);
                        await reloadTemplates(v);
                      }}
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-550 shadow-sm cursor-pointer"
                    >
                      <option value="">Todas</option>
                      <option value="true">Activas</option>
                      <option value="false">Inactivas</option>
                    </select>
                    <button
                      onClick={openTemplateCreate}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-[9px] font-black uppercase tracking-widest text-white hover:bg-blue-700 active:scale-95 transition-all cursor-pointer shadow-sm"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Nueva Plantilla
                    </button>
                  </div>
                </div>

                <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1 hide-scrollbar">
                  {templates.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-slate-200 py-12 text-center bg-slate-50/20">
                      <p className="text-xs font-semibold text-slate-400">No hay plantillas de WhatsApp registradas.</p>
                    </div>
                  )}
                  {templates.map((t, i) => (
                    <div key={t.id || i} className="rounded-2xl border border-slate-100 bg-slate-50/40 p-4 transition-all hover:bg-white hover:shadow-sm">
                      <div className="mb-3">
                        <div className="flex items-center justify-between">
                          <h4 className="flex items-center gap-1.5 text-xs font-extrabold text-slate-800 uppercase tracking-wide">
                            {t.nombre || "Plantilla"}
                            {(t.predeterminada || t.esDefault) && (
                              <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[8px] font-black text-emerald-600 border border-emerald-100 shadow-inner">
                                ACTIVA DEFAULT
                              </span>
                            )}
                          </h4>
                          <button onClick={() => setConfirmDeleteTemplate({ open: true, id: t.id })} className="text-slate-350 hover:text-rose-500 active:scale-90 transition-all cursor-pointer p-0.5">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="mt-2 text-[10px] leading-relaxed text-slate-550 font-semibold">
                          {t.contenido || t.mensaje || "Mensaje vacío..."}
                        </p>
                      </div>
                      <div className="flex gap-3 border-t border-slate-100/50 pt-2.5">
                        <button onClick={() => openTemplateEdit(t.id)} className="text-[9px] font-black uppercase tracking-widest text-slate-600 hover:text-slate-900 cursor-pointer">
                          Editar
                        </button>
                        <button onClick={() => makeDefaultTemplate(t.id)} className="text-[9px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-700 cursor-pointer">
                          Establecer Default
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* VARIABLES CRÍTICAS */}
            {activeTab === "parametros" && (
              <div className="space-y-5 animate-in fade-in duration-300">
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Parámetros del Sistema</h3>
                    <p className="text-xs font-semibold text-slate-400 mt-1">Valores internos guardados directamente en la base de datos.</p>
                  </div>
                  <button
                    type="button"
                    onClick={loadAll}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800 active:scale-95 transition-all cursor-pointer shadow-sm"
                  >
                    <RefreshCw className="h-4.5 w-4.5" />
                  </button>
                </div>

                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1 hide-scrollbar">
                  {settings.map((cfg, i) => {
                    const clave = cfg?.clave ?? cfg?.Clave ?? `cfg-${i}`;
                    const valor = cfg?.valor ?? cfg?.Valor ?? "";
                    return (
                      <div
                        key={String(clave)}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-2xl border border-slate-100 bg-slate-50/30 hover:bg-slate-50/60 transition-all duration-200"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">{clave}</p>
                          <p className="text-[11px] font-extrabold text-slate-500 mt-1 font-mono truncate bg-white border border-slate-100 rounded-lg px-2 py-1 shadow-inner">
                            {String(valor)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => openConfigEditor(cfg)}
                          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-[9px] font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50 cursor-pointer shadow-sm"
                        >
                          <Pencil className="h-3 w-3" />
                          Editar
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        </div>

      </div>

      {/* DIÁLOGO EDICIÓN CONFIGURACIONES */}
      {modalOpen && (
        <BackofficeDialog maxWidthClass="max-w-md" onBackdropClick={saving ? undefined : () => setModalOpen(false)}>
          <form onSubmit={saveConfig} className={modalFormRootClass}>
            <div className="border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Editar parámetro operacional</h3>
              <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Modificación directa de la clave de configuración.</p>
            </div>
            <div className={modalFormBodyScrollClass + " space-y-4"}>
              <div>
                <label className="mb-1 block text-[9px] font-extrabold uppercase tracking-widest text-slate-450">Clave del sistema *</label>
                <input
                  value={configForm.clave}
                  onChange={(e) => setConfigForm((f) => ({ ...f, clave: e.target.value }))}
                  placeholder="Clave"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-xs font-semibold focus:border-blue-500 focus:outline-none transition-all"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-[9px] font-extrabold uppercase tracking-widest text-slate-450">Valor *</label>
                <input
                  value={configForm.valor}
                  onChange={(e) => setConfigForm((f) => ({ ...f, valor: e.target.value }))}
                  placeholder="Valor"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-xs font-semibold focus:border-blue-500 focus:outline-none transition-all"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-[9px] font-extrabold uppercase tracking-widest text-slate-450">Descripción (opcional)</label>
                <textarea
                  value={configForm.descripcion}
                  onChange={(e) => setConfigForm((f) => ({ ...f, descripcion: e.target.value }))}
                  placeholder="Descripción de la variable..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-xs font-semibold focus:border-blue-500 focus:outline-none transition-all"
                  rows={3}
                />
              </div>
            </div>
            <div className={modalFormFooterClass + " border-t border-slate-100 pt-4 mt-5 flex justify-end gap-3"}>
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-extrabold uppercase tracking-widest text-slate-550 hover:bg-slate-50 cursor-pointer">
                Cancelar
              </button>
              <button disabled={saving} className="rounded-lg bg-blue-600 px-5 py-2.5 text-xs font-extrabold uppercase tracking-widest text-white disabled:opacity-50 hover:bg-blue-700 cursor-pointer shadow-md">
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </form>
        </BackofficeDialog>
      )}

      {/* DIÁLOGO WHATSAPP TEMPLATE */}
      {templateModalOpen && (
        <BackofficeDialog maxWidthClass="max-w-lg" onBackdropClick={saving ? undefined : () => setTemplateModalOpen(false)}>
          <form onSubmit={saveTemplate} className={modalFormRootClass}>
            <div className="border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
                {templateForm.id ? "Editar plantilla WhatsApp" : "Nueva plantilla WhatsApp"}
              </h3>
              <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Personalización de facturas enviadas automáticamente por WhatsApp.</p>
            </div>
            <div className={modalFormBodyScrollClass + " space-y-4"}>
              <div>
                <label className="mb-1 block text-[9px] font-extrabold uppercase tracking-widest text-slate-450">Nombre descriptivo *</label>
                <input
                  value={templateForm.nombre}
                  onChange={(e) => setTemplateForm((f) => ({ ...f, nombre: e.target.value }))}
                  placeholder="Ej: Plantilla por Defecto"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-xs font-semibold focus:border-blue-500 focus:outline-none transition-all"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-[9px] font-extrabold uppercase tracking-widest text-slate-450">Mensaje de Factura *</label>
                <textarea
                  value={templateForm.contenido}
                  onChange={(e) => setTemplateForm((f) => ({ ...f, contenido: e.target.value }))}
                  placeholder={"Hola {NombreCliente},\n\nLe enviamos su factura:\n📄 Factura: {NumeroFactura}\n💰 Monto: C$ {Monto}\n..."}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-xs font-semibold focus:border-blue-500 focus:outline-none transition-all font-mono leading-relaxed"
                  rows={6}
                  required
                />
                <div className="mt-2.5 rounded-xl border border-indigo-100 bg-indigo-50/50 p-3 text-[10px] font-semibold text-indigo-700 leading-relaxed">
                  Variables dinámicas soportadas: <br />
                  <span className="font-mono bg-white border border-indigo-150 px-1 py-0.5 rounded text-[9px]">{"{NombreCliente}"}</span>,{" "}
                  <span className="font-mono bg-white border border-indigo-150 px-1 py-0.5 rounded text-[9px]">{"{NumeroFactura}"}</span>,{" "}
                  <span className="font-mono bg-white border border-indigo-150 px-1 py-0.5 rounded text-[9px]">{"{Monto}"}</span>,{" "}
                  <span className="font-mono bg-white border border-indigo-150 px-1 py-0.5 rounded text-[9px]">{"{Mes}"}</span>,{" "}
                  <span className="font-mono bg-white border border-indigo-150 px-1 py-0.5 rounded text-[9px]">{"{Categoria}"}</span>,{" "}
                  <span className="font-mono bg-white border border-indigo-150 px-1 py-0.5 rounded text-[9px]">{"{Estado}"}</span>,{" "}
                  <span className="font-mono bg-white border border-indigo-150 px-1 py-0.5 rounded text-[9px]">{"{EnlacePDF}"}</span>
                </div>
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <label className="inline-flex items-center gap-2.5 text-xs font-bold text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={templateForm.activa} onChange={(e) => setTemplateForm((f) => ({ ...f, activa: e.target.checked }))} className="h-4 w-4 rounded border-slate-200 text-indigo-650" />
                  Activar plantilla
                </label>
                <label className="inline-flex items-center gap-2.5 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={templateForm.predeterminada}
                    onChange={(e) => setTemplateForm((f) => ({ ...f, predeterminada: e.target.checked }))}
                    className="h-4 w-4 rounded border-slate-200 text-indigo-650"
                  />
                  Marcar como predeterminada (Default)
                </label>
              </div>
            </div>
            <div className={modalFormFooterClass + " border-t border-slate-100 pt-4 mt-5 flex justify-end gap-3"}>
              <button type="button" onClick={() => setTemplateModalOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-extrabold uppercase tracking-widest text-slate-550 hover:bg-slate-50 cursor-pointer">
                Cancelar
              </button>
              <button disabled={saving} className="rounded-lg bg-blue-600 px-5 py-2.5 text-xs font-extrabold uppercase tracking-widest text-white disabled:opacity-50 hover:bg-blue-700 cursor-pointer shadow-md">
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </form>
        </BackofficeDialog>
      )}

      <ConfirmModal
        open={confirmDeleteTemplate.open}
        onClose={() => setConfirmDeleteTemplate({ open: false, id: null })}
        onConfirm={async () => {
          if (confirmDeleteTemplate.id) await removeTemplate(confirmDeleteTemplate.id);
        }}
        title="Eliminar plantilla"
        message="¿Deseas eliminar esta plantilla de WhatsApp?"
        confirmLabel="Eliminar"
        variant="danger"
        loading={saving}
      />
    </BackofficePageShell>
  );
}
