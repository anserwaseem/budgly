import { useMemo } from "react";
import { endOfMonth, startOfMonth, subMonths } from "date-fns";
import type { Transaction } from "@/lib/types";
import type { DashboardAnalytics } from "../types";

export function useDashboardAnalytics(
  filteredTransactions: Transaction[],
  allTransactions: Transaction[]
): DashboardAnalytics {
  return useMemo(() => {
    const now = new Date();
    const startOfLastMonth = startOfMonth(subMonths(now, 1));
    const endOfLastMonth = endOfMonth(subMonths(now, 1));

    const periodExpenses = filteredTransactions.filter(
      (t) => t.type === "expense"
    );
    const periodIncome = filteredTransactions.filter(
      (t) => t.type === "income"
    );

    const lastMonth = allTransactions.filter(
      (t) =>
        new Date(t.date) >= startOfLastMonth &&
        new Date(t.date) <= endOfLastMonth &&
        t.type === "expense"
    );

    const periodTotal = periodExpenses.reduce((sum, t) => sum + t.amount, 0);
    const lastMonthTotal = lastMonth.reduce((sum, t) => sum + t.amount, 0);
    const periodIncomeTotal = periodIncome.reduce(
      (sum, t) => sum + t.amount,
      0
    );

    const needsTotal = periodExpenses
      .filter((t) => t.necessity === "need")
      .reduce((sum, t) => sum + t.amount, 0);
    const wantsTotal = periodExpenses
      .filter((t) => t.necessity === "want")
      .reduce((sum, t) => sum + t.amount, 0);
    const uncategorized = periodExpenses
      .filter((t) => !t.necessity)
      .reduce((sum, t) => sum + t.amount, 0);

    const savingsThisPeriod = periodIncomeTotal - periodTotal;
    const savingsRate =
      periodIncomeTotal > 0 ? (savingsThisPeriod / periodIncomeTotal) * 100 : 0;

    const byMode: Record<string, number> = {};
    periodExpenses.forEach((t) => {
      byMode[t.paymentMode] = (byMode[t.paymentMode] || 0) + t.amount;
    });

    const byReason: Record<string, number> = {};
    periodExpenses.forEach((t) => {
      const reason = t.reason || "Other";
      byReason[reason] = (byReason[reason] || 0) + t.amount;
    });
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
      const weekStart = new Date();
      weekStart.setDate(
        weekStart.getDate() - weekStart.getDay() - weeksAgo * 7
      );
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      return filteredTransactions
        .filter((t) => {
          const d = new Date(t.date);
          return d >= weekStart && d <= weekEnd && t.type === "expense";
        })
        .reduce((sum, t) => sum + t.amount, 0);
    };

    const thisWeekTotal = getWeekData(0);
    const lastWeekTotal = getWeekData(1);
    const weekChange =
      lastWeekTotal > 0
        ? ((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100
        : 0;

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
    const percentChange =
      lastMonthTotal > 0
        ? ((periodTotal - lastMonthTotal) / lastMonthTotal) * 100
        : 0;

    const biggestExpense =
      periodExpenses.length > 0
        ? periodExpenses.reduce(
            (max, t) => (t.amount > max.amount ? t : max),
            periodExpenses[0]
          )
        : null;

    const frequencyByReason: Record<string, number> = {};
    periodExpenses.forEach((t) => {
      const reason = t.reason || "Other";
      frequencyByReason[reason] = (frequencyByReason[reason] || 0) + 1;
    });
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
    };
  }, [filteredTransactions, allTransactions]);
}
