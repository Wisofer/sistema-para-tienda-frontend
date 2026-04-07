import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import { OnlineStatusProvider } from "./contexts/OnlineStatusContext.jsx";
import { NetworkStatus } from "./components/NetworkStatus.jsx";

export default function App() {
  return (
    <OnlineStatusProvider>
      <NetworkStatus />
      <RouterProvider router={router} />
    </OnlineStatusProvider>
  );
}
