import { createContext, useContext } from "react";
import { Detector } from "react-detect-offline";

const OnlineStatusContext = createContext(true);

/**
 * Estado global en línea / fuera de línea (navigator + eventos; sin polling externo por defecto).
 */
export function OnlineStatusProvider({ children }) {
  return (
    <Detector
      polling={false}
      render={({ online }) => (
        <OnlineStatusContext.Provider value={Boolean(online)}>
          {children}
        </OnlineStatusContext.Provider>
      )}
    />
  );
}

export function useOnlineStatus() {
  return Boolean(useContext(OnlineStatusContext));
}
