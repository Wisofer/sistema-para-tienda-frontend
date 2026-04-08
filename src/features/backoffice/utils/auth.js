/**
 * Roles del JWT/API: Administrador, Cajero, Normal (claim `Rol`).
 * @see docs/API_V1.md — políticas Admin / Cajero / Pos
 */

export function getUserRoleText(user) {
  if (!user || typeof user !== "object") return "";
  return String(
    user.rol ??
      user.Rol ??
      user.role ??
      user.Role ??
      user.nombreRol ??
      user.NombreRol ??
      user.perfil ??
      user.Perfil ??
      ""
  )
    .trim()
    .toLowerCase();
}

export function isAdminUser(user) {
  const role = getUserRoleText(user);
  return role.includes("admin") || role.includes("administrador");
}

/** Política Cajero: Administrador o Cajero (caja + GET /catalogos/*). */
export function isCajeroUser(user) {
  if (isAdminUser(user)) return false;
  const role = getUserRoleText(user);
  return role.includes("cajero");
}

/**
 * Rol Normal (ventas/POS/clientes/productos lectura; sin dashboard, caja ni catálogos maestros por API).
 * Roles desconocidos se tratan como Normal (mínimo privilegio).
 */
export function isNormalUser(user) {
  if (!user || typeof user !== "object") return false;
  if (isAdminUser(user)) return false;
  if (isCajeroUser(user)) return false;
  return true;
}

export function isVendedorUser(user) {
  const role = getUserRoleText(user);
  return role.includes("vendedor") || role.includes("mesero") || role.includes("waiter");
}

/** Puede llamar GET /api/v1/catalogos/* (Administrador o Cajero). */
export function canUseCatalogosApi(user) {
  return isAdminUser(user) || isCajeroUser(user);
}

/** Puede llamar GET /api/v1/dashboard/* y KPIs agregados. */
export function canUseDashboardApi(user) {
  return isAdminUser(user);
}

/** GET listado completo /configuraciones y plantillas WhatsApp (solo Admin en API). */
export function canUseConfiguracionesCompletas(user) {
  return isAdminUser(user);
}

const ALL_VIEWS = [
  "dashboard",
  "products",
  "categories",
  "clients",
  "pos",
  "cashier",
  "users",
  "settings",
  "reports",
];

export function getAllowedViewIds(user) {
  if (!user || typeof user !== "object") {
    return ALL_VIEWS;
  }
  if (isAdminUser(user)) {
    return ALL_VIEWS;
  }
  if (isCajeroUser(user)) {
    return ["pos", "products", "categories", "clients", "cashier"];
  }
  return ["pos", "products", "clients"];
}

export function canAccessView(user, viewId) {
  return getAllowedViewIds(user).includes(viewId);
}
