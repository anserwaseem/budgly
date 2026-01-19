import { useMemo } from "react";
import { Transaction, StreakData } from "@/lib/types";
import { format, startOfDay, subDays, differenceInDays } from "date-fns";

/**
 * Calculate streaks from transaction history.
 * Streaks are derived data calculated directly from transactions.
 */
export function useStreakTracking(transactions: Transaction[]) {
  const streakData = useMemo((): StreakData => {
    const today = startOfDay(new Date());
    const todayStr = format(today, "yyyy-MM-dd");
    const todayISO = today.toISOString();

    const expenseDates = new Set<string>();
    let earliestExpenseDate: Date | null = null;

    for (const t of transactions) {
      if (t.type === "expense") {
        const txDate = startOfDay(new Date(t.date));
        const dateStr = format(txDate, "yyyy-MM-dd");
        expenseDates.add(dateStr);

        if (!earliestExpenseDate || txDate < earliestExpenseDate) {
          earliestExpenseDate = txDate;
        }
      }
    }

    const todayHasExpense = expenseDates.has(todayStr);
    const maxDaysToCheck = earliestExpenseDate
      ? Math.min(365, differenceInDays(today, earliestExpenseDate) + 1)
      : 365;

    let noExpenseStreak = 0;
    let spendingStreak = 0;
    let lastNoExpenseDate: string | null = null;
    let lastSpendingDate: string | null = null;

    if (!todayHasExpense) {
      noExpenseStreak = 1;
      lastNoExpenseDate = todayISO;

      for (let i = 1; i < maxDaysToCheck; i++) {
        const checkDate = subDays(today, i);
        const dateStr = format(checkDate, "yyyy-MM-dd");

        if (!expenseDates.has(dateStr)) {
          noExpenseStreak++;
        } else {
          break;
        }
      }
    }

    if (todayHasExpense) {
      spendingStreak = 1;
      lastSpendingDate = todayISO;

      for (let i = 1; i < maxDaysToCheck; i++) {
        const checkDate = subDays(today, i);
        const dateStr = format(checkDate, "yyyy-MM-dd");

        if (expenseDates.has(dateStr)) {
          spendingStreak++;
        } else {
          break;
        }
      }
    }

    return {
      noExpenseStreak,
      spendingStreak,
      lastNoExpenseDate,
      lastSpendingDate,
    };
  }, [transactions]);

  return { streakData };
}
