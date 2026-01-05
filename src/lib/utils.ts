import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Haptic feedback utility for mobile devices
// Supports both Android (vibrate API) and iOS Safari (checkbox switch workaround)
export function haptic(
  type: "light" | "medium" | "heavy" | "success" | "warning" | "error" = "light"
) {
  // Try Android vibrate API first
  if (navigator.vibrate) {
    const patterns: Record<string, number | number[]> = {
      light: 10,
      medium: 20,
      heavy: 30,
      success: [10, 50, 20],
      warning: [20, 30, 20],
      error: [30, 50, 30, 50, 30],
    };

    navigator.vibrate(patterns[type]);
    return;
  }

  // iOS Safari workaround: use checkbox switch for haptic feedback
  // This works on Safari 17.4+ by programmatically toggling a switch input
  if (typeof document !== "undefined") {
    try {
      // create a hidden switch input element
      const switchInput = document.createElement("input");
      switchInput.type = "checkbox";
      switchInput.style.position = "fixed";
      switchInput.style.opacity = "0";
      switchInput.style.pointerEvents = "none";
      switchInput.style.top = "-1000px";
      switchInput.setAttribute("role", "switch");
      document.body.appendChild(switchInput);

      // toggle the switch to trigger haptic feedback
      // for different types, we can toggle multiple times with delays
      const toggleCount =
        type === "error" ? 3 : type === "warning" || type === "success" ? 2 : 1;

      let toggleIndex = 0;
      const toggleSwitch = () => {
        if (toggleIndex < toggleCount) {
          switchInput.checked = !switchInput.checked;
          toggleIndex++;

          if (toggleIndex < toggleCount) {
            // add small delay between toggles for patterns
            setTimeout(toggleSwitch, type === "error" ? 50 : 30);
          } else {
            // clean up after last toggle
            setTimeout(() => {
              document.body.removeChild(switchInput);
            }, 100);
          }
        }
      };

      toggleSwitch();
    } catch {
      // silently fail if DOM manipulation fails
    }
  }
}
