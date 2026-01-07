import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { isOnline, onConnectivityChange } from "../connectivity";

describe("connectivity", () => {
  beforeEach(() => {
    // ensure navigator exists in test environment (jsdom should provide it, but be defensive)
    if (typeof navigator === "undefined") {
      // @ts-expect-error - creating navigator for test
      global.navigator = {
        onLine: true,
      };
    } else {
      // reset navigator.onLine to true
      Object.defineProperty(navigator, "onLine", {
        writable: true,
        configurable: true,
        value: true,
      });
    }
    // trigger online event to reset cached status to true
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("online"));
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("isOnline", () => {
    it("should return true when navigator.onLine is true", () => {
      if (typeof navigator === "undefined" || typeof window === "undefined") {
        // skip if environment not available
        expect(true).toBe(true);
        return;
      }

      Object.defineProperty(navigator, "onLine", {
        writable: true,
        configurable: true,
        value: true,
      });

      // trigger offline then online to update cached status
      window.dispatchEvent(new Event("offline"));
      window.dispatchEvent(new Event("online"));

      expect(isOnline()).toBe(true);
    });

    it("should return false when navigator.onLine is false", () => {
      if (typeof navigator === "undefined" || typeof window === "undefined") {
        // skip if environment not available
        expect(true).toBe(true);
        return;
      }

      Object.defineProperty(navigator, "onLine", {
        writable: true,
        configurable: true,
        value: false,
      });

      // trigger offline event to update cached status
      window.dispatchEvent(new Event("offline"));

      expect(isOnline()).toBe(false);
    });

    it("should return a boolean value", () => {
      const result = isOnline();
      expect(typeof result).toBe("boolean");
    });
  });

  describe("onConnectivityChange", () => {
    it("should call callback when online event fires", () => {
      if (typeof window === "undefined") {
        expect(true).toBe(true); // skip if no window
        return;
      }

      const callback = vi.fn();
      const unsubscribe = onConnectivityChange(callback);

      // simulate online event
      window.dispatchEvent(new Event("online"));

      expect(callback).toHaveBeenCalledTimes(1);

      unsubscribe();
    });

    it("should call callback when offline event fires", () => {
      if (typeof window === "undefined") {
        expect(true).toBe(true); // skip if no window
        return;
      }

      const callback = vi.fn();
      const unsubscribe = onConnectivityChange(callback);

      // simulate offline event
      window.dispatchEvent(new Event("offline"));

      expect(callback).toHaveBeenCalledTimes(1);

      unsubscribe();
    });

    it("should allow multiple callbacks", () => {
      if (typeof window === "undefined") {
        expect(true).toBe(true); // skip if no window
        return;
      }

      const callback1 = vi.fn();
      const callback2 = vi.fn();

      const unsubscribe1 = onConnectivityChange(callback1);
      const unsubscribe2 = onConnectivityChange(callback2);

      window.dispatchEvent(new Event("online"));

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);

      unsubscribe1();
      unsubscribe2();
    });

    it("should stop calling callback after unsubscribe", () => {
      if (typeof window === "undefined") {
        expect(true).toBe(true); // skip if no window
        return;
      }

      const callback = vi.fn();
      const unsubscribe = onConnectivityChange(callback);

      window.dispatchEvent(new Event("online"));
      expect(callback).toHaveBeenCalledTimes(1);

      unsubscribe();

      window.dispatchEvent(new Event("online"));
      expect(callback).toHaveBeenCalledTimes(1); // still 1, not 2
    });

    it("should update online status when online event fires", () => {
      if (typeof window === "undefined" || typeof navigator === "undefined") {
        expect(true).toBe(true); // skip if environment not available
        return;
      }

      // set initial offline state
      Object.defineProperty(navigator, "onLine", {
        writable: true,
        configurable: true,
        value: false,
      });

      // trigger offline event to set cached status to false
      window.dispatchEvent(new Event("offline"));
      expect(isOnline()).toBe(false);

      // now trigger online event
      Object.defineProperty(navigator, "onLine", {
        writable: true,
        configurable: true,
        value: true,
      });
      window.dispatchEvent(new Event("online"));

      // status should be updated
      expect(isOnline()).toBe(true);
    });

    it("should update online status when offline event fires", () => {
      if (typeof window === "undefined" || typeof navigator === "undefined") {
        expect(true).toBe(true); // skip if environment not available
        return;
      }

      Object.defineProperty(navigator, "onLine", {
        writable: true,
        configurable: true,
        value: true,
      });

      // trigger online to set cached status
      window.dispatchEvent(new Event("online"));
      expect(isOnline()).toBe(true);

      // set offline and trigger event
      Object.defineProperty(navigator, "onLine", {
        writable: true,
        configurable: true,
        value: false,
      });
      window.dispatchEvent(new Event("offline"));

      // status should be updated
      expect(isOnline()).toBe(false);
    });
  });
});
