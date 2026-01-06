import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { triggerHaptic } from "tactus";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Haptic feedback utility for mobile devices
// Uses Tactus library which provides reliable haptic feedback on iOS Safari/Chrome
// See: https://tactus.aadee.xyz/
// triggerHaptic(duration?) - duration in ms, defaults to 100ms

export function haptic(
  type: "light" | "medium" | "heavy" | "success" | "warning" | "error" = "light"
) {
  try {
    // Map our haptic types to Tactus triggerHaptic calls
    // Different durations and patterns for different types
    switch (type) {
      case "light":
        triggerHaptic(50); // short, light haptic
        break;
      case "medium":
        triggerHaptic(100); // default duration
        break;
      case "heavy":
        triggerHaptic(150); // longer, stronger haptic
        break;
      case "success":
        // Success: two quick haptics
        triggerHaptic(50);
        setTimeout(() => triggerHaptic(50), 80);
        break;
      case "warning":
        // Warning: medium then light
        triggerHaptic(100);
        setTimeout(() => triggerHaptic(50), 100);
        break;
      case "error":
        // Error: three haptics (strong pattern)
        triggerHaptic(100);
        setTimeout(() => triggerHaptic(50), 100);
        setTimeout(() => triggerHaptic(100), 200);
        break;
      default:
        triggerHaptic(100);
    }
  } catch {
    // silently fail if haptic feedback fails
  }
}
