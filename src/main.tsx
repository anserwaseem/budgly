import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";
import { setServiceWorkerRegistration } from "./lib/pwa";

// Register service worker with update handling
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.ready.then((registration) => {
    setServiceWorkerRegistration(registration);
  });
}

// This registers the service worker and handles updates
registerSW({
  immediate: true,
  onRegisteredSW(swUrl, registration) {
    if (registration) {
      setServiceWorkerRegistration(registration);
      // Check for updates every 5 minutes
      setInterval(
        () => {
          registration.update();
        },
        5 * 60 * 1000
      );
    }
  },
});

createRoot(document.getElementById("root")!).render(<App />);
