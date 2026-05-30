import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { User, Eye, EyeOff, Lock, Sparkles } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { SessionLoader } from "../components/SessionLoader";
import { APP_NAME } from "../config/brand.js";

const LOGO_SRC = "/assets/images/Recurso%209LaFeria_Colectivo.png";

const BRAND_MODULES = [
  { label: "Inventario", value: "Stock Real",     icon: "📦", color: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8" },
  { label: "Ventas",     value: "Punto de Venta", icon: "🛍️", color: "#f0f9ff", border: "#bae6fd", text: "#0369a1" },
  { label: "Dashboard",  value: "Reportes",       icon: "📊", color: "#eef2ff", border: "#c7d2fe", text: "#4338ca" },
];

const INPUT_CLASS =
  "w-full rounded-xl border border-slate-200 bg-slate-50 py-3 text-slate-800 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20";

function isNetworkError(msg) {
  return ["fetch", "Failed", "Connection", "Network"].some((k) => msg.includes(k));
}

export function Login() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user, loading, sessionLoading, login } = useAuth();
  const [form, setForm]               = useState({ username: "", password: "" });
  const [error, setError]             = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const redirectTo = location.state?.from?.pathname || "/app";

  useEffect(() => { document.documentElement.classList.remove("dark"); }, []);
  useEffect(() => { if (!loading && user) navigate(redirectTo, { replace: true }); }, [user, loading, navigate, redirectTo]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await login(form.username.trim(), form.password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const msg = err?.message || "";
      setError(isNetworkError(msg)
        ? "No se pudo conectar con el servidor. Verifica que el backend esté en ejecución."
        : msg || "Usuario o contraseña incorrectos.");
    }
  };

  if (sessionLoading) return <SessionLoader message="Iniciando sesión..." />;
  if (loading)        return <SessionLoader message="Verificando sesión..." />;

  return (
    <div className="relative min-h-screen overflow-hidden bg-white">
      {/* Manchas de fondo decorativas */}
      <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-primary-100 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-emerald-100 blur-3xl" />

      <div className="relative mx-auto grid min-h-screen w-full max-w-6xl grid-cols-1 items-center gap-6 p-4 md:p-8 lg:grid-cols-[1.1fr_0.9fr]">

        {/* ── Panel izquierdo: Branding ── */}
        <BrandPanel />

        {/* ── Panel derecho: Formulario ── */}
        <section className="mx-auto w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-sm md:p-9">
          <div className="mb-5 flex justify-center">
            <img src={LOGO_SRC} alt={`${APP_NAME} logo`} className="h-24 w-auto object-contain" />
          </div>
          <div className="mb-7 text-center">
            <h1 className="text-2xl font-bold text-slate-800">Iniciar sesión</h1>
            <p className="mt-1 text-sm text-slate-500">Accede al panel administrativo</p>
          </div>

          {import.meta.env.VITE_STATIC_MODE === "true" && (
            <div className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
              <Sparkles className="h-5 w-5 shrink-0" />
              Modo estático activo: cualquier usuario y contraseña.
            </div>
          )}

          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Usuario */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Usuario</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <User className="h-5 w-5" />
                </span>
                <input
                  id="login-username"
                  type="text"
                  placeholder="ej. administrador"
                  value={form.username}
                  onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                  autoComplete="username"
                  required
                  className={`${INPUT_CLASS} pl-11 pr-4`}
                />
              </div>
            </div>

            {/* Contraseña */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Contraseña</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock className="h-5 w-5" />
                </span>
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  autoComplete="current-password"
                  required
                  className={`${INPUT_CLASS} pl-11 pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                  className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="mt-2 w-full rounded-xl bg-primary-600 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-primary-700"
            >
              Entrar al sistema
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500">
            © {new Date().getFullYear()} {APP_NAME}
          </p>
          <p className="mt-1 text-center text-xs text-slate-500">
            Desarrollado por{" "}
            <a href="https://www.cowib.es" target="_blank" rel="noopener noreferrer" className="font-medium text-primary-600 hover:underline">
              COWIB
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}

/** Card de branding izquierda (solo visible en desktop). */
function BrandPanel() {
  return (
    <section
      className="relative hidden h-[640px] overflow-hidden rounded-3xl bg-white shadow-sm lg:flex lg:flex-col"
      style={{ border: "1px solid #e2e8f0" }}
    >
      {/* Círculos decorativos */}
      <Blob style={{ top: 20, right: -50, width: 220, height: 220, background: "rgba(59,130,246,0.05)" }} />
      <Blob style={{ bottom: -60, left: -30, width: 180, height: 180, background: "rgba(14,165,233,0.06)" }} />

      <div className="relative flex flex-1 flex-col justify-between p-9">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}>
            <img src={LOGO_SRC} alt={`${APP_NAME} logo`} className="h-8 w-8 object-contain" />
          </div>
          <div>
            <p className="text-base font-bold text-slate-800">{APP_NAME}</p>
            <p className="text-xs text-slate-400">Sistema de facturación</p>
          </div>
        </div>

        {/* Headline */}
        <div>
          <span className="mb-4 inline-block rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-widest" style={{ background: "#eff6ff", color: "#2563eb" }}>
            Panel Administrativo
          </span>
          <h2 className="text-3xl font-extrabold leading-snug text-slate-900 xl:text-4xl">
            Control total de tu<br />
            <span style={{ color: "#2563eb" }}>inventario y ventas.</span>
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-500">
            Gestiona productos, clientes y caja<br />desde una sola interfaz profesional.
          </p>
          {/* Separador */}
          <div className="mt-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-100" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Módulos incluidos</span>
            <div className="h-px flex-1 bg-slate-100" />
          </div>
        </div>

        {/* Módulos */}
        <div className="grid grid-cols-3 gap-3">
          {BRAND_MODULES.map((m) => (
            <div
              key={m.label}
              className="flex flex-col items-center gap-1.5 rounded-2xl py-4 text-center"
              style={{ background: m.color, border: `1px solid ${m.border}` }}
            >
              <span className="text-xl">{m.icon}</span>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{m.label}</p>
              <p className="text-xs font-bold" style={{ color: m.text }}>{m.value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Círculo decorativo de fondo. */
function Blob({ style }) {
  return (
    <div
      style={{
        position: "absolute",
        borderRadius: "50%",
        pointerEvents: "none",
        ...style,
      }}
    />
  );
}
