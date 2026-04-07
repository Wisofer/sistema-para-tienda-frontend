const SIN_RED = "Sin conexión a internet";

/**
 * Textos y helpers para estado sin conexión (banner, tooltips, snackbars).
 */
export const NETWORK_UI = {
  banner: SIN_RED,
  snackbarCobrar: `${SIN_RED}. No se puede cobrar.`,
  snackbarCompletarCobro: `${SIN_RED}. No se puede completar el cobro.`,
  snackbarGuardar: `${SIN_RED}. No se puede guardar.`,
};

/** Para `title` en botones deshabilitados por red. */
export function offlineButtonTitle(isOnline) {
  return isOnline ? undefined : SIN_RED;
}
