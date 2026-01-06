import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";
import { setServiceWorkerRegistration } from "./lib/pwa";

// render app immediately without waiting for service worker
createRoot(document.getElementById("root")!).render(<App />);

// register service worker asynchronously after app renders
// this prevents blocking the initial render when online
if ("serviceWorker" in navigator) {
  // check for existing registration first (non-blocking)
  navigator.serviceWorker.ready.then((registration) => {
    setServiceWorkerRegistration(registration);
  });

  // register service worker after app renders using requestIdleCallback
  // falls back to setTimeout if requestIdleCallback is not available
  const registerServiceWorker = () => {
    registerSW({
      immediate: true,
      onRegisteredSW(swUrl, registration) {
        if (registration) {
          setServiceWorkerRegistration(registration);
          // check for updates every 5 minutes
          setInterval(
            () => {
              registration.update();
            },
            5 * 60 * 1000
          );
        }
      },
    });
  };

  if ("requestIdleCallback" in window) {
    requestIdleCallback(registerServiceWorker, { timeout: 2000 });
  } else {
    setTimeout(registerServiceWorker, 0);
  }
}
