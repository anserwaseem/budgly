// connectivity detection utility for checking online/offline status

let onlineStatus = typeof navigator !== "undefined" ? navigator.onLine : true;
const listeners = new Set<() => void>();

// initialize online status
if (typeof window !== "undefined") {
  onlineStatus = navigator.onLine;

  // listen to online/offline events
  window.addEventListener("online", () => {
    onlineStatus = true;
    listeners.forEach((listener) => listener());
  });

  window.addEventListener("offline", () => {
    onlineStatus = false;
    listeners.forEach((listener) => listener());
  });
}

/**
 * Check if device is currently online
 * @returns true if online, false if offline
 */
export function isOnline(): boolean {
  return onlineStatus;
}

/**
 * Subscribe to connectivity changes
 * @param callback function to call when connectivity status changes
 * @returns unsubscribe function
 */
export function onConnectivityChange(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}
