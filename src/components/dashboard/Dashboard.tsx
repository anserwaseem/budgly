import { useCallback, useMemo } from "react";
import type { AppSettings, StreakData, Transaction } from "@/lib/types";
import type { TimePeriod } from "@/hooks/useFilters";
import { saveDashboardLayout } from "@/lib/storage";
import { getPeriodText } from "@/lib/utils";
import { formatMaskedAmount, maskReason } from "@/lib/privacy";
import { useDashboardAnalytics } from "./hooks/useDashboardAnalytics";
import { useDashboardLayout } from "./hooks/useDashboardLayout";
import { DashboardSortableGrid } from "./dnd/DashboardSortableGrid";
import type { DashboardCardId, DashboardCardSpec } from "./types";
import { buildDashboardCards } from "./registry/buildDashboardCards";

interface DashboardProps {
  transactions: Transaction[];
  currencySymbol: string;
  settings: AppSettings;
  streakData?: StreakData;
  timePeriod: TimePeriod;
}

export function Dashboard({
  transactions,
  currencySymbol,
  settings,
  streakData,
  timePeriod,
}: DashboardProps) {
  // Parent already filtered; keep API stable.
  const filteredTransactions = transactions;

  const periodText = getPeriodText(timePeriod);
  const analytics = useDashboardAnalytics(filteredTransactions, transactions);

  const pieData = useMemo(
    () =>
      [
        {
          name: "Needs",
          value: analytics.needsTotal,
          color: "hsl(190, 65%, 50%)",
        },
        {
          name: "Wants",
          value: analytics.wantsTotal,
          color: "hsl(35, 85%, 55%)",
        },
        {
          name: "Other",
          value: analytics.uncategorized,
          color: "hsl(220, 15%, 40%)",
        },
      ].filter((d) => d.value > 0),
    [analytics.needsTotal, analytics.wantsTotal, analytics.uncategorized]
  );

  const formatAmountWithPrivacy = useCallback(
    (amount: number) => {
      if (settings.privacyMode?.hideAmounts) {
        return formatMaskedAmount(amount, settings, currencySymbol);
      }
      // Use the same formatter as masked mode uses for consistency in the refactor.
      // (Previously this used parser.formatAmount; if you want that exact formatting back,
      // swap in the old helper here.)
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

  const { layout, setLayout, orderedIds } = useDashboardLayout();

  const cards: Record<DashboardCardId, DashboardCardSpec> = useMemo(() => {
    return buildDashboardCards({
      analytics,
      currencySymbol,
      settings,
      streakData,
      periodText,
      pieData,
      formatAmountWithPrivacy,
      maskReason: (reason) => maskReason(reason, settings),
    });
  }, [
    analytics,
    currencySymbol,
    settings,
    streakData,
    periodText,
    pieData,
    formatAmountWithPrivacy,
  ]);

  const renderCard = useCallback(
    (id: DashboardCardId) => cards[id]?.render() ?? null,
    [cards]
  );

  const isFullWidth = useCallback(
    (id: DashboardCardId) =>
      Boolean(cards[id]?.fullWidth || cards[id]?.type === "chart"),
    [cards]
  );

  const onReorder = useCallback(
    (newOrder: DashboardCardId[]) => {
      // Keep the same card metadata but update ordering.
      const updated = layout.map((c) => {
        const newIndex = newOrder.indexOf(c.id as DashboardCardId);
        return newIndex === -1 ? c : { ...c, order: newIndex };
      });
      setLayout(updated);
      saveDashboardLayout(updated);
    },
    [layout, setLayout]
  );

  // Only show cards that exist in registry (defensive against old layouts)
  const visibleIds = orderedIds.filter((id) => Boolean(cards[id]));

  return (
    <div className="space-y-4 animate-fade-in">
      <DashboardSortableGrid
        ids={visibleIds}
        isFullWidth={isFullWidth}
        renderCard={renderCard}
        onReorder={onReorder}
      />
    </div>
  );
}
