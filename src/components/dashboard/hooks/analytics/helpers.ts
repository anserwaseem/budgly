import { endOfMonth, startOfMonth, subMonths } from "date-fns";
import type { Transaction } from "@/lib/types";

export function getLastMonthRange() {
  const now = new Date();
  return {
    start: startOfMonth(subMonths(now, 1)),
    end: endOfMonth(subMonths(now, 1)),
  };
}

export function filterByType(
  transactions: Transaction[],
  type: Transaction["type"]
): Transaction[] {
  return transactions.filter((t) => t.type === type);
}

export function calculateTotal(transactions: Transaction[]): number {
  return transactions.reduce((sum, t) => sum + t.amount, 0);
}

export function calculateByNecessity(
  transactions: Transaction[],
  necessity: "need" | "want" | null
): number {
  return calculateTotal(transactions.filter((t) => t.necessity === necessity));
}

export function aggregateByKey(
  transactions: Transaction[],
  getKey: (t: Transaction) => string
): Record<string, number> {
  const result: Record<string, number> = {};
  transactions.forEach((t) => {
    const key = getKey(t);
    result[key] = (result[key] || 0) + t.amount;
  });
  return result;
}

export function filterByDateRange(
  transactions: Transaction[],
  start: Date,
  end: Date
): Transaction[] {
  return transactions.filter((t) => {
    const date = new Date(t.date);
    return date >= start && date <= end;
  });
}

export function getWeekStart(weeksAgo: number = 0): Date {
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() - weeksAgo * 7);
  return weekStart;
}

export function getWeekEnd(weekStart: Date): Date {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  return weekEnd;
}

export function calculatePercentChange(
  current: number,
  previous: number
): number {
  return previous > 0 ? ((current - previous) / previous) * 100 : 0;
}
