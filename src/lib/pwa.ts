// PWA utilities for managing service worker updates

let swRegistration: ServiceWorkerRegistration | null = null;

export function setServiceWorkerRegistration(registration: ServiceWorkerRegistration) {
  swRegistration = registration;
}

export function getServiceWorkerRegistration(): ServiceWorkerRegistration | null {
  return swRegistration;
}

export async function checkForUpdates(): Promise<boolean> {
  if (!swRegistration) {
    // Try to get the registration
    if ('serviceWorker' in navigator) {
      try {
        swRegistration = await navigator.serviceWorker.getRegistration();
      } catch {
        return false;
      }
    }
  }

  if (swRegistration) {
    try {
      await swRegistration.update();
      return swRegistration.waiting !== null;
    } catch {
      return false;
    }
  }
  return false;
}

export function applyUpdate(): void {
  if (swRegistration?.waiting) {
    swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
    window.location.reload();
  } else {
    // Force reload to get fresh content
    window.location.reload();
  }
}

export async function forceRefresh(): Promise<void> {
  // Clear all caches
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
  }

  // Unregister service worker and reload
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map(reg => reg.unregister()));
  }

  window.location.reload();
}
