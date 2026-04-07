import { useLayoutEffect } from "react";
import { useOnlineStatus } from "../hooks/useOnlineStatus.js";
import { NETWORK_UI } from "../constants/networkUi.js";

const BANNER_HEIGHT = "2.5rem";

/**
 * Banner fijo cuando no hay conexión. Ajusta `--offline-banner-height` en :root para no tapar contenido.
 */
export function NetworkStatus() {
  const online = useOnlineStatus();

  useLayoutEffect(() => {
    document.documentElement.style.setProperty(
      "--offline-banner-height",
      online ? "0px" : BANNER_HEIGHT
    );
    return () => {
      document.documentElement.style.removeProperty("--offline-banner-height");
    };
  }, [online]);

  if (online) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed top-0 left-0 right-0 z-[9999] flex h-10 items-center justify-center bg-red-600 px-4 text-center text-sm font-semibold text-white shadow-md"
    >
      {NETWORK_UI.banner}
    </div>
  );
}
