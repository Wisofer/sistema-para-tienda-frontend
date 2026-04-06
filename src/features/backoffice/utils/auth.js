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

export function isVendedorUser(user) {
  const role = getUserRoleText(user);
  return role.includes("vendedor") || role.includes("mesero") || role.includes("waiter");
}

export function getAllowedViewIds(user) {
  if (isAdminUser(user)) {
    return [
      "dashboard",
      "products",
      "categories",
      "providers",
      "clients",
      "pos",
      "cashier",
      "users",
      "settings",
      "reports",
    ];
  }
  if (isVendedorUser(user)) {
    return ["dashboard", "pos", "clients", "products"];
  }
  return ["dashboard", "pos"];
}

export function canAccessView(user, viewId) {
  return getAllowedViewIds(user).includes(viewId);
}
