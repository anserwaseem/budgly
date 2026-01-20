import { useMemo } from "react";
import type { Transaction } from "@/lib/types";
import type { DashboardAnalytics } from "../types";
import { PIE_CHART_COLORS } from "../constants";
import {
  getLastMonthRange,
  filterByType,
  calculateTotal,
  calculateByNecessity,
  aggregateByKey,
  filterByDateRange,
  getWeekStart,
  getWeekEnd,
  calculatePercentChange,
} from "./analytics/helpers";

export function useDashboardAnalytics(
  filteredTransactions: Transaction[],
  allTransactions: Transaction[]
): DashboardAnalytics {
  return useMemo(() => {
    const now = new Date();
    const { start: startOfLastMonth, end: endOfLastMonth } =
      getLastMonthRange();

    const periodExpenses = filterByType(filteredTransactions, "expense");
    const periodIncome = filterByType(filteredTransactions, "income");

    const lastMonth = filterByType(
      filterByDateRange(allTransactions, startOfLastMonth, endOfLastMonth),
      "expense"
    );

    const periodTotal = calculateTotal(periodExpenses);
    const lastMonthTotal = calculateTotal(lastMonth);
    const periodIncomeTotal = calculateTotal(periodIncome);

    const needsTotal = calculateByNecessity(periodExpenses, "need");
    const wantsTotal = calculateByNecessity(periodExpenses, "want");
    const uncategorized = calculateByNecessity(periodExpenses, null);

    const savingsThisPeriod = periodIncomeTotal - periodTotal;
    const savingsRate =
      periodIncomeTotal > 0 ? (savingsThisPeriod / periodIncomeTotal) * 100 : 0;

    const byMode = aggregateByKey(periodExpenses, (t) => t.paymentMode);
    const byReason = aggregateByKey(periodExpenses, (t) => t.reason || "Other");
    const topCategories = Object.entries(byReason)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));

    const dailyData: { day: string; expense: number; income: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toDateString();
      const dayExpense = filteredTransactions
        .filter(
          (t) =>
            new Date(t.date).toDateString() === dateStr && t.type === "expense"
        )
        .reduce((sum, t) => sum + t.amount, 0);
      const dayIncome = filteredTransactions
        .filter(
          (t) =>
            new Date(t.date).toDateString() === dateStr && t.type === "income"
        )
        .reduce((sum, t) => sum + t.amount, 0);
      dailyData.push({
        day: date.toLocaleDateString("en", { weekday: "short" }),
        expense: dayExpense,
        income: dayIncome,
      });
    }

    const monthlyTrend: {
      month: string;
      expense: number;
      income: number;
      savings: number;
    }[] = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const monthExpense = allTransactions
        .filter((t) => {
          const d = new Date(t.date);
          return d >= monthStart && d <= monthEnd && t.type === "expense";
        })
        .reduce((sum, t) => sum + t.amount, 0);
      const monthIncome = allTransactions
        .filter((t) => {
          const d = new Date(t.date);
          return d >= monthStart && d <= monthEnd && t.type === "income";
        })
        .reduce((sum, t) => sum + t.amount, 0);
      monthlyTrend.push({
        month: monthStart.toLocaleDateString("en", { month: "short" }),
        expense: monthExpense,
        income: monthIncome,
        savings: monthIncome - monthExpense,
      });
    }

    const getWeekData = (weeksAgo: number) => {
      const weekStart = getWeekStart(weeksAgo);
      const weekEnd = getWeekEnd(weekStart);
      return calculateTotal(
        filterByType(
          filterByDateRange(filteredTransactions, weekStart, weekEnd),
          "expense"
        )
      );
    };

    const thisWeekTotal = getWeekData(0);
    const lastWeekTotal = getWeekData(1);
    const weekChange = calculatePercentChange(thisWeekTotal, lastWeekTotal);

    const transactionDates = filteredTransactions.map((t) => new Date(t.date));
    const minDate =
      transactionDates.length > 0
        ? new Date(Math.min(...transactionDates.map((d) => d.getTime())))
        : now;
    const maxDate =
      transactionDates.length > 0
        ? new Date(Math.max(...transactionDates.map((d) => d.getTime())))
        : now;
    const daysInPeriod = Math.max(
      1,
      Math.ceil(
        (maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1
    );
    const avgDailySpending =
      periodExpenses.length > 0 ? periodTotal / daysInPeriod : 0;

    const transactionCount = periodExpenses.length;
    const percentChange = calculatePercentChange(periodTotal, lastMonthTotal);

    const biggestExpense =
      periodExpenses.length > 0
        ? periodExpenses.reduce(
            (max, t) => (t.amount > max.amount ? t : max),
            periodExpenses[0]
          )
        : null;

    const frequencyByReason = periodExpenses.reduce(
      (acc, t) => {
        const reason = t.reason || "Other";
        acc[reason] = (acc[reason] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    const mostFrequentCategory = Object.entries(frequencyByReason).sort(
      ([, a], [, b]) => b - a
    )[0];

    const avgTransactionSize =
      transactionCount > 0 ? periodTotal / transactionCount : 0;
    const uniqueSpendingDays = new Set(
      periodExpenses.map((t) => new Date(t.date).toDateString())
    ).size;

    const today = new Date();
    let streakDays = 0;
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toDateString();
      const hasExpense = filteredTransactions.some(
        (t) =>
          new Date(t.date).toDateString() === dateStr && t.type === "expense"
      );
      if (hasExpense) {
        streakDays++;
      } else if (i > 0) {
        break;
      }
    }

    const dailyTotals: Record<string, number> = {};
    periodExpenses.forEach((t) => {
      const dateStr = new Date(t.date).toDateString();
      dailyTotals[dateStr] = (dailyTotals[dateStr] || 0) + t.amount;
    });
    const dailyTotalsArr = Object.entries(dailyTotals);
    const bestDay =
      dailyTotalsArr.length > 0
        ? dailyTotalsArr.reduce((min, curr) => (curr[1] < min[1] ? curr : min))
        : null;
    const worstDay =
      dailyTotalsArr.length > 0
        ? dailyTotalsArr.reduce((max, curr) => (curr[1] > max[1] ? curr : max))
        : null;

    const needsWantsRatio =
      wantsTotal > 0 ? needsTotal / wantsTotal : needsTotal > 0 ? Infinity : 0;

    const pieData = [
      {
        name: "Needs",
        value: needsTotal,
        color: PIE_CHART_COLORS.needs,
      },
      {
        name: "Wants",
        value: wantsTotal,
        color: PIE_CHART_COLORS.wants,
      },
      {
        name: "Other",
        value: uncategorized,
        color: PIE_CHART_COLORS.other,
      },
    ].filter((d) => d.value > 0);

    return {
      periodTotal,
      lastMonthTotal,
      periodIncomeTotal,
      percentChange,
      needsTotal,
      wantsTotal,
      uncategorized,
      savingsThisPeriod,
      savingsRate,
      thisWeekTotal,
      lastWeekTotal,
      weekChange,
      avgDailySpending,
      transactionCount,
      topCategories,
      byMode: Object.entries(byMode).map(([name, value]) => ({ name, value })),
      dailyData,
      monthlyTrend,
      biggestExpense,
      mostFrequentCategory,
      avgTransactionSize,
      uniqueSpendingDays,
      streakDays,
      bestDay,
      worstDay,
      needsWantsRatio,
      pieData,
    };
  }, [filteredTransactions, allTransactions]);
}
