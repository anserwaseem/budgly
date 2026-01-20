import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowUpRight,
  Award,
  Calendar,
  CalendarCheck,
  DollarSign,
  Flame,
  Leaf,
  PiggyBank,
  Repeat,
  Target,
  Wallet,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { formatAmount } from "@/lib/parser";
import { formatMaskedAmount } from "@/lib/privacy";
import type { AppSettings, StreakData } from "@/lib/types";
import type {
  DashboardCardId,
  DashboardCardSpec,
  DashboardAnalytics,
} from "../types";
import { StatCard } from "../cards/StatCard";
import { InsightCard } from "../cards/InsightCard";
import { MODE_COLORS, CATEGORY_COLORS } from "../constants";

interface BuildCtx {
  analytics: DashboardAnalytics;
  currencySymbol: string;
  settings: AppSettings;
  streakData?: StreakData;
  periodText: string;
  formatAmountWithPrivacy: (amount: number) => string;
  maskReason: (reason: string) => string;
}

export function buildDashboardCards(
  ctx: BuildCtx
): Record<DashboardCardId, DashboardCardSpec> {
  const {
    analytics,
    currencySymbol,
    settings,
    streakData,
    periodText,
    formatAmountWithPrivacy,
    maskReason,
  } = ctx;

  const cards: Record<DashboardCardId, DashboardCardSpec> = {
    spent: {
      id: "spent",
      type: "stat",
      render: () => (
        <StatCard
          icon={Wallet}
          label="Spent"
          value={formatAmountWithPrivacy(analytics.periodTotal)}
          valueClassName="text-expense"
          trend={{
            value: analytics.percentChange,
            label: "vs last month",
            isPositive: analytics.percentChange <= 0,
          }}
        />
      ),
    },
    income: {
      id: "income",
      type: "stat",
      render: () => (
        <StatCard
          icon={ArrowUpRight}
          label="Income"
          value={formatAmountWithPrivacy(analytics.periodIncomeTotal)}
          valueClassName="text-income"
          subtitle="Filtered results"
        />
      ),
    },
    savings: {
      id: "savings",
      type: "stat",
      render: () => (
        <StatCard
          icon={PiggyBank}
          label="Savings"
          value={`${analytics.savingsThisPeriod >= 0 ? "+" : ""}${formatAmountWithPrivacy(Math.abs(analytics.savingsThisPeriod))}`}
          valueClassName={
            analytics.savingsThisPeriod >= 0 ? "text-income" : "text-expense"
          }
          subtitle={`${analytics.savingsRate >= 0 ? analytics.savingsRate.toFixed(0) : 0}% savings rate`}
        />
      ),
    },
    "this-week": {
      id: "this-week",
      type: "stat",
      render: () => (
        <StatCard
          icon={Calendar}
          label="This Week"
          value={formatAmountWithPrivacy(analytics.thisWeekTotal)}
          trend={{
            value: analytics.weekChange,
            label: "vs last week",
            isPositive: analytics.weekChange <= 0,
          }}
        />
      ),
    },
    "daily-avg": {
      id: "daily-avg",
      type: "stat",
      render: () => (
        <StatCard
          icon={Target}
          label="Daily Avg"
          value={formatAmountWithPrivacy(analytics.avgDailySpending)}
          subtitle={`Per day ${periodText}`}
        />
      ),
    },
    "avg-txn": {
      id: "avg-txn",
      type: "insight",
      render: () => (
        <InsightCard
          icon={DollarSign}
          label="Avg/Txn"
          value={formatAmountWithPrivacy(analytics.avgTransactionSize)}
          subtitle="Per transaction"
        />
      ),
    },
    "no-expense-streak": {
      id: "no-expense-streak",
      type: "insight",
      render: () => {
        const days = streakData?.noExpenseStreak || 0;
        return (
          <InsightCard
            icon={Leaf}
            label="No-Expense Streak"
            value={`${days} ${days === 1 ? "day" : "days"}`}
            subtitle="Days without spending"
            iconClassName="text-income"
            valueClassName="text-income"
          />
        );
      },
    },
    "spending-streak": {
      id: "spending-streak",
      type: "insight",
      render: () => {
        const days = streakData?.spendingStreak || analytics.streakDays;
        return (
          <InsightCard
            icon={Flame}
            label="Spending Streak"
            value={`${days} ${days === 1 ? "day" : "days"}`}
            subtitle="Consecutive spending"
          />
        );
      },
    },
    "active-days": {
      id: "active-days",
      type: "insight",
      render: () => (
        <InsightCard
          icon={CalendarCheck}
          label="Active Days"
          value={String(analytics.uniqueSpendingDays)}
          subtitle="Days with expenses"
        />
      ),
    },
    "most-frequent": {
      id: "most-frequent",
      type: "insight",
      render: () =>
        analytics.mostFrequentCategory ? (
          <div className="bg-card border border-border rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1.5">
              <Repeat className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="text-[10px] sm:text-xs uppercase tracking-wider">
                Most Frequent
              </span>
            </div>
            <p className="text-sm sm:text-lg font-bold text-foreground capitalize truncate">
              {maskReason(analytics.mostFrequentCategory[0])}
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
              {analytics.mostFrequentCategory[1]} times {periodText}
            </p>
          </div>
        ) : null,
    },
    "biggest-expense": {
      id: "biggest-expense",
      type: "insight",
      fullWidth: true,
      render: () =>
        analytics.biggestExpense ? (
          <div className="bg-card border border-border rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-2">
              <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="text-[10px] sm:text-xs uppercase tracking-wider">
                Biggest Expense
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium capitalize truncate text-sm sm:text-base flex-1">
                {maskReason(analytics.biggestExpense.reason || "Unknown")}
              </p>
              <p className="text-sm sm:text-lg font-bold font-mono text-expense flex-shrink-0">
                {formatAmountWithPrivacy(analytics.biggestExpense.amount)}
              </p>
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
              {format(new Date(analytics.biggestExpense.date), "MMM d")} via{" "}
              {analytics.biggestExpense.paymentMode}
            </p>
          </div>
        ) : null,
    },
    "best-day": {
      id: "best-day",
      type: "insight",
      render: () =>
        analytics.bestDay ? (
          <div className="bg-card border border-border rounded-xl p-3 sm:p-4">
            <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Best Day
            </p>
            <p className="font-mono font-bold text-income text-sm sm:text-base truncate">
              {formatAmountWithPrivacy(analytics.bestDay[1])}
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              {format(new Date(analytics.bestDay[0]), "MMM d")}
            </p>
          </div>
        ) : null,
    },
    "worst-day": {
      id: "worst-day",
      type: "insight",
      render: () =>
        analytics.worstDay ? (
          <div className="bg-card border border-border rounded-xl p-3 sm:p-4">
            <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Worst Day
            </p>
            <p className="font-mono font-bold text-expense text-sm sm:text-base truncate">
              {formatAmountWithPrivacy(analytics.worstDay[1])}
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              {format(new Date(analytics.worstDay[0]), "MMM d")}
            </p>
          </div>
        ) : null,
    },
    "daily-chart": {
      id: "daily-chart",
      type: "chart",
      render: () => (
        <div className="bg-card border border-border rounded-xl p-3 sm:p-4">
          <h3 className="text-xs sm:text-sm font-medium text-muted-foreground mb-3 sm:mb-4">
            Last 7 Days
          </h3>
          <div className="h-32 sm:h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.dailyData}>
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "11px",
                  }}
                  formatter={(value: number, name: string) => [
                    settings.privacyMode?.hideAmounts
                      ? formatMaskedAmount(value, settings, currencySymbol)
                      : `${currencySymbol}${formatAmount(value)}`,
                    name === "expense" ? "Spent" : "Earned",
                  ]}
                />
                <Bar
                  dataKey="expense"
                  fill="hsl(var(--expense))"
                  radius={[4, 4, 0, 0]}
                  name="expense"
                />
                <Bar
                  dataKey="income"
                  fill="hsl(var(--income))"
                  radius={[4, 4, 0, 0]}
                  name="income"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-3 sm:gap-4 mt-2">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-expense" />
              <span className="text-[10px] sm:text-xs text-muted-foreground">
                Expense
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-income" />
              <span className="text-[10px] sm:text-xs text-muted-foreground">
                Income
              </span>
            </div>
          </div>
        </div>
      ),
    },
    "top-categories": {
      id: "top-categories",
      type: "chart",
      render: () =>
        analytics.topCategories.length > 0 ? (
          <div className="bg-card border border-border rounded-xl p-3 sm:p-4">
            <h3 className="text-xs sm:text-sm font-medium text-muted-foreground mb-3 sm:mb-4">
              Top Spending
            </h3>
            <div className="space-y-2.5 sm:space-y-3">
              {analytics.topCategories.map((cat, index) => {
                const maxValue = analytics.topCategories[0]?.value || 1;
                const percentage = (cat.value / maxValue) * 100;
                return (
                  <div key={cat.name}>
                    <div className="flex items-center justify-between mb-1 gap-2">
                      <span className="text-xs sm:text-sm font-medium capitalize truncate flex-1">
                        {maskReason(cat.name)}
                      </span>
                      <span className="font-mono text-xs sm:text-sm text-muted-foreground flex-shrink-0">
                        {formatAmountWithPrivacy(cat.value)}
                      </span>
                    </div>
                    <div className="h-1.5 sm:h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor:
                            CATEGORY_COLORS[index % CATEGORY_COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null,
    },
    "needs-wants": {
      id: "needs-wants",
      type: "chart",
      render: () =>
        analytics.pieData.length > 0 ? (
          <div className="bg-card border border-border rounded-xl p-3 sm:p-4">
            <h3 className="text-xs sm:text-sm font-medium text-muted-foreground mb-3 sm:mb-4">
              Needs vs Wants
            </h3>
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-20 h-20 sm:w-28 sm:h-28 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={20}
                      outerRadius={36}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {analytics.pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-1.5 sm:space-y-2 min-w-0">
                {analytics.pieData.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                      <span
                        className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-xs sm:text-sm truncate">
                        {maskReason(item.name)}
                      </span>
                    </div>
                    <span className="font-mono text-xs sm:text-sm flex-shrink-0">
                      {formatAmountWithPrivacy(item.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null,
    },
    "payment-mode": {
      id: "payment-mode",
      type: "chart",
      render: () =>
        analytics.byMode.length > 0 ? (
          <div className="bg-card border border-border rounded-xl p-3 sm:p-4">
            <h3 className="text-xs sm:text-sm font-medium text-muted-foreground mb-3 sm:mb-4">
              By Payment Mode
            </h3>
            <div className="h-28 sm:h-36">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.byMode} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: "hsl(var(--muted-foreground))",
                      fontSize: 10,
                    }}
                    width={60}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "11px",
                    }}
                    formatter={(value: number) => [
                      settings.privacyMode?.hideAmounts
                        ? formatMaskedAmount(value, settings, currencySymbol)
                        : `${currencySymbol}${formatAmount(value)}`,
                      "Spent",
                    ]}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {analytics.byMode.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={MODE_COLORS[index % MODE_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : null,
    },
    "monthly-trend": {
      id: "monthly-trend",
      type: "chart",
      render: () => (
        <div className="bg-card border border-border rounded-xl p-3 sm:p-4">
          <h3 className="text-xs sm:text-sm font-medium text-muted-foreground mb-3 sm:mb-4">
            6 Month Overview
          </h3>
          <div className="h-36 sm:h-44">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.monthlyTrend}>
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "11px",
                  }}
                  formatter={(value: number, name: string) => {
                    const labels: Record<string, string> = {
                      income: "Income",
                      expense: "Expense",
                      savings: "Savings",
                    };
                    return [
                      settings.privacyMode?.hideAmounts
                        ? formatMaskedAmount(value, settings, currencySymbol)
                        : `${currencySymbol}${formatAmount(value)}`,
                      labels[name] || name,
                    ];
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="hsl(var(--income))"
                  fill="hsl(var(--income))"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  stroke="hsl(var(--expense))"
                  fill="hsl(var(--expense))"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="savings"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: 3 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      ),
    },
    "last-month": {
      id: "last-month",
      type: "stat",
      fullWidth: true,
      render: () => (
        <div className="bg-card border border-border rounded-xl p-3 sm:p-4">
          <h3 className="text-xs sm:text-sm font-medium text-muted-foreground mb-2 sm:mb-3">
            Last Month
          </h3>
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm sm:text-lg font-bold font-mono text-foreground truncate">
                {formatAmountWithPrivacy(analytics.lastMonthTotal)}
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                Total spent
              </p>
            </div>
            <div
              className={cn(
                "px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium flex-shrink-0",
                analytics.percentChange <= 0
                  ? "bg-income/15 text-income"
                  : "bg-expense/15 text-expense"
              )}
            >
              {analytics.percentChange <= 0 ? "↓" : "↑"}{" "}
              {Math.abs(analytics.percentChange).toFixed(0)}%
            </div>
          </div>
        </div>
      ),
    },
  };

  return cards;
}
