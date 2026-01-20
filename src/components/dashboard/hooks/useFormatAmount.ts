import { useCallback } from "react";
import type { AppSettings } from "@/lib/types";
import { formatMaskedAmount } from "@/lib/privacy";

/**
 * Hook for formatting amounts with privacy mode support
 */
export function useFormatAmount(settings: AppSettings, currencySymbol: string) {
  return useCallback(
    (amount: number) => {
      if (settings.privacyMode?.hideAmounts) {
        return formatMaskedAmount(amount, settings, currencySymbol);
      }
      // Use the same formatter as masked mode uses for consistency
      return formatMaskedAmount(
        amount,
        {
          ...settings,
          privacyMode: { ...settings.privacyMode, hideAmounts: false },
        },
        currencySymbol
      );
    },
    [settings, currencySymbol]
  );
}
