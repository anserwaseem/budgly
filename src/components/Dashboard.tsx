import { useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, LineChart, Line, AreaChart, Area } from 'recharts';
import { Transaction } from '@/lib/types';
import { formatAmount } from '@/lib/parser';
import { TrendingUp, TrendingDown, Wallet, Target, Calendar, CreditCard, PiggyBank, ArrowUpRight, ArrowDownRight, Flame, Award, Repeat, DollarSign, CalendarCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface DashboardProps {
  transactions: Transaction[];
  currencySymbol: string;
}

export function Dashboard({ transactions, currencySymbol }: DashboardProps) {
  const analytics = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const thisMonth = transactions.filter(
      (t) => new Date(t.date) >= startOfMonth && t.type === 'expense'
    );
    const thisMonthIncome = transactions.filter(
      (t) => new Date(t.date) >= startOfMonth && t.type === 'income'
    );
    const lastMonth = transactions.filter(
      (t) => new Date(t.date) >= startOfLastMonth && new Date(t.date) <= endOfLastMonth && t.type === 'expense'
    );
    const lastMonthIncome = transactions.filter(
      (t) => new Date(t.date) >= startOfLastMonth && new Date(t.date) <= endOfLastMonth && t.type === 'income'
    );

    const thisMonthTotal = thisMonth.reduce((sum, t) => sum + t.amount, 0);
    const lastMonthTotal = lastMonth.reduce((sum, t) => sum + t.amount, 0);
    const thisMonthIncomeTotal = thisMonthIncome.reduce((sum, t) => sum + t.amount, 0);
    const lastMonthIncomeTotal = lastMonthIncome.reduce((sum, t) => sum + t.amount, 0);

    const needsTotal = thisMonth.filter((t) => t.necessity === 'need').reduce((sum, t) => sum + t.amount, 0);
    const wantsTotal = thisMonth.filter((t) => t.necessity === 'want').reduce((sum, t) => sum + t.amount, 0);
    const uncategorized = thisMonth.filter((t) => !t.necessity).reduce((sum, t) => sum + t.amount, 0);

    // Savings this month
    const savingsThisMonth = thisMonthIncomeTotal - thisMonthTotal;
    const savingsLastMonth = lastMonthIncomeTotal - lastMonthTotal;
    const savingsRate = thisMonthIncomeTotal > 0 ? (savingsThisMonth / thisMonthIncomeTotal) * 100 : 0;

    // By payment mode
    const byMode: Record<string, number> = {};
    thisMonth.forEach((t) => {
      byMode[t.paymentMode] = (byMode[t.paymentMode] || 0) + t.amount;
    });

    // Top spending categories (by reason)
    const byReason: Record<string, number> = {};
    thisMonth.forEach((t) => {
      const reason = t.reason || 'Other';
      byReason[reason] = (byReason[reason] || 0) + t.amount;
    });
    const topCategories = Object.entries(byReason)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));

    // Daily spending for the last 7 days
    const dailyData: { day: string; expense: number; income: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toDateString();
      const dayExpense = transactions
        .filter((t) => new Date(t.date).toDateString() === dateStr && t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      const dayIncome = transactions
        .filter((t) => new Date(t.date).toDateString() === dateStr && t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      dailyData.push({
        day: date.toLocaleDateString('en', { weekday: 'short' }),
        expense: dayExpense,
        income: dayIncome,
      });
    }

    // Monthly trend (last 6 months) with income
    const monthlyTrend: { month: string; expense: number; income: number; savings: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const monthExpense = transactions
        .filter((t) => {
          const d = new Date(t.date);
          return d >= monthStart && d <= monthEnd && t.type === 'expense';
        })
        .reduce((sum, t) => sum + t.amount, 0);
      const monthIncome = transactions
        .filter((t) => {
          const d = new Date(t.date);
          return d >= monthStart && d <= monthEnd && t.type === 'income';
        })
        .reduce((sum, t) => sum + t.amount, 0);
      monthlyTrend.push({
        month: monthStart.toLocaleDateString('en', { month: 'short' }),
        expense: monthExpense,
        income: monthIncome,
        savings: monthIncome - monthExpense,
      });
    }

    // Weekly spending comparison
    const getWeekData = (weeksAgo: number) => {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() - (weeksAgo * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      return transactions
        .filter((t) => {
          const d = new Date(t.date);
          return d >= weekStart && d <= weekEnd && t.type === 'expense';
        })
        .reduce((sum, t) => sum + t.amount, 0);
    };

    const thisWeekTotal = getWeekData(0);
    const lastWeekTotal = getWeekData(1);
    const weekChange = lastWeekTotal > 0 ? ((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100 : 0;

    // Average daily spending
    const avgDailySpending = thisMonth.length > 0 
      ? thisMonthTotal / new Date().getDate()
      : 0;

    // Transaction count
    const transactionCount = thisMonth.length;

    const percentChange = lastMonthTotal > 0 
      ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 
      : 0;

    // Biggest expense this month
    const biggestExpense = thisMonth.length > 0 
      ? thisMonth.reduce((max, t) => t.amount > max.amount ? t : max, thisMonth[0])
      : null;

    // Most frequent category
    const frequencyByReason: Record<string, number> = {};
    thisMonth.forEach(t => {
      const reason = t.reason || 'Other';
      frequencyByReason[reason] = (frequencyByReason[reason] || 0) + 1;
    });
    const mostFrequentCategory = Object.entries(frequencyByReason)
      .sort(([, a], [, b]) => b - a)[0];

    // Average transaction size
    const avgTransactionSize = transactionCount > 0 
      ? thisMonthTotal / transactionCount 
      : 0;

    // Days with spending
    const uniqueSpendingDays = new Set(
      thisMonth.map(t => new Date(t.date).toDateString())
    ).size;

    // Spending streak (consecutive days with expenses)
    const today = new Date();
    let streakDays = 0;
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toDateString();
      const hasExpense = transactions.some(
        t => new Date(t.date).toDateString() === dateStr && t.type === 'expense'
      );
      if (hasExpense) {
        streakDays++;
      } else if (i > 0) {
        break;
      }
    }

    // Best/worst spending day this month
    const dailyTotals: Record<string, number> = {};
    thisMonth.forEach(t => {
      const dateStr = new Date(t.date).toDateString();
      dailyTotals[dateStr] = (dailyTotals[dateStr] || 0) + t.amount;
    });
    const dailyTotalsArr = Object.entries(dailyTotals);
    const bestDay = dailyTotalsArr.length > 0 
      ? dailyTotalsArr.reduce((min, curr) => curr[1] < min[1] ? curr : min)
      : null;
    const worstDay = dailyTotalsArr.length > 0 
      ? dailyTotalsArr.reduce((max, curr) => curr[1] > max[1] ? curr : max)
      : null;

    // Needs/wants ratio
    const needsWantsRatio = wantsTotal > 0 ? needsTotal / wantsTotal : needsTotal > 0 ? Infinity : 0;

    return {
      thisMonthTotal,
      lastMonthTotal,
      thisMonthIncomeTotal,
      percentChange,
      needsTotal,
      wantsTotal,
      uncategorized,
      savingsThisMonth,
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
  }, [transactions]);

  const pieData = [
    { name: 'Needs', value: analytics.needsTotal, color: 'hsl(190, 65%, 50%)' },
    { name: 'Wants', value: analytics.wantsTotal, color: 'hsl(35, 85%, 55%)' },
    { name: 'Other', value: analytics.uncategorized, color: 'hsl(220, 15%, 40%)' },
  ].filter((d) => d.value > 0);

  const modeColors = [
    'hsl(158, 55%, 50%)',
    'hsl(190, 65%, 50%)',
    'hsl(35, 85%, 55%)',
    'hsl(265, 50%, 60%)',
    'hsl(0, 60%, 55%)',
  ];

  const categoryColors = [
    'hsl(var(--primary))',
    'hsl(190, 65%, 50%)',
    'hsl(35, 85%, 55%)',
    'hsl(265, 50%, 60%)',
    'hsl(158, 55%, 50%)',
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Wallet className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Spent</span>
          </div>
          <p className="text-xl font-bold font-mono text-expense">
            {currencySymbol}{formatAmount(analytics.thisMonthTotal)}
          </p>
          <div className={cn(
            "flex items-center gap-1 text-xs mt-1",
            analytics.percentChange <= 0 ? 'text-income' : 'text-expense'
          )}>
            {analytics.percentChange <= 0 ? (
              <TrendingDown className="w-3 h-3" />
            ) : (
              <TrendingUp className="w-3 h-3" />
            )}
            <span>{Math.abs(analytics.percentChange).toFixed(0)}% vs last month</span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <ArrowUpRight className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Income</span>
          </div>
          <p className="text-xl font-bold font-mono text-income">
            {currencySymbol}{formatAmount(analytics.thisMonthIncomeTotal)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">This month</p>
        </div>
      </div>

      {/* Savings & Weekly Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <PiggyBank className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Savings</span>
          </div>
          <p className={cn(
            "text-xl font-bold font-mono",
            analytics.savingsThisMonth >= 0 ? 'text-income' : 'text-expense'
          )}>
            {analytics.savingsThisMonth >= 0 ? '+' : ''}{currencySymbol}{formatAmount(Math.abs(analytics.savingsThisMonth))}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {analytics.savingsRate >= 0 ? analytics.savingsRate.toFixed(0) : 0}% savings rate
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Calendar className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">This Week</span>
          </div>
          <p className="text-xl font-bold font-mono text-foreground">
            {currencySymbol}{formatAmount(analytics.thisWeekTotal)}
          </p>
          <div className={cn(
            "flex items-center gap-1 text-xs mt-1",
            analytics.weekChange <= 0 ? 'text-income' : 'text-expense'
          )}>
            {analytics.weekChange <= 0 ? (
              <ArrowDownRight className="w-3 h-3" />
            ) : (
              <ArrowUpRight className="w-3 h-3" />
            )}
            <span>{Math.abs(analytics.weekChange).toFixed(0)}% vs last week</span>
          </div>
        </div>
      </div>

      {/* Avg Daily & Transaction Count */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Target className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Daily Avg</span>
          </div>
          <p className="text-xl font-bold font-mono text-foreground">
            {currencySymbol}{formatAmount(analytics.avgDailySpending)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Per day this month</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <CreditCard className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Transactions</span>
          </div>
          <p className="text-xl font-bold font-mono text-foreground">
            {analytics.transactionCount}
          </p>
          <p className="text-xs text-muted-foreground mt-1">This month</p>
        </div>
      </div>

      {/* New Insights Row 1 */}
      <div className="grid grid-cols-2 gap-3">
        {/* Spending Streak */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Flame className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Streak</span>
          </div>
          <p className="text-xl font-bold font-mono text-foreground">
            {analytics.streakDays} {analytics.streakDays === 1 ? 'day' : 'days'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Consecutive spending</p>
        </div>

        {/* Avg Transaction */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <DollarSign className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Avg/Txn</span>
          </div>
          <p className="text-xl font-bold font-mono text-foreground">
            {currencySymbol}{formatAmount(analytics.avgTransactionSize)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Per transaction</p>
        </div>
      </div>

      {/* New Insights Row 2 */}
      <div className="grid grid-cols-2 gap-3">
        {/* Active Days */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <CalendarCheck className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Active Days</span>
          </div>
          <p className="text-xl font-bold font-mono text-foreground">
            {analytics.uniqueSpendingDays}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Days with expenses</p>
        </div>

        {/* Most Frequent */}
        {analytics.mostFrequentCategory && (
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Repeat className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider">Most Frequent</span>
            </div>
            <p className="text-lg font-bold text-foreground capitalize truncate">
              {analytics.mostFrequentCategory[0]}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.mostFrequentCategory[1]} times this month
            </p>
          </div>
        )}
      </div>

      {/* Biggest Expense & Best/Worst Day */}
      {analytics.biggestExpense && (
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Award className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Biggest Expense</span>
          </div>
          <div className="flex items-center justify-between">
            <p className="font-medium capitalize truncate max-w-[60%]">
              {analytics.biggestExpense.reason || 'Unknown'}
            </p>
            <p className="text-lg font-bold font-mono text-expense">
              {currencySymbol}{formatAmount(analytics.biggestExpense.amount)}
            </p>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {format(new Date(analytics.biggestExpense.date), 'MMM d')} via {analytics.biggestExpense.paymentMode}
          </p>
        </div>
      )}

      {/* Best & Worst Day */}
      {analytics.bestDay && analytics.worstDay && analytics.bestDay[0] !== analytics.worstDay[0] && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Best Day</p>
            <p className="font-mono font-bold text-income">
              {currencySymbol}{formatAmount(analytics.bestDay[1])}
            </p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(analytics.bestDay[0]), 'MMM d')}
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Worst Day</p>
            <p className="font-mono font-bold text-expense">
              {currencySymbol}{formatAmount(analytics.worstDay[1])}
            </p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(analytics.worstDay[0]), 'MMM d')}
            </p>
          </div>
        </div>
      )}

      {/* Daily Income vs Expense Chart */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-4">Last 7 Days</h3>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics.dailyData}>
              <XAxis 
                dataKey="day" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} 
              />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value: number, name: string) => [
                  `${currencySymbol}${formatAmount(value)}`,
                  name === 'expense' ? 'Spent' : 'Earned'
                ]}
              />
              <Bar dataKey="expense" fill="hsl(var(--expense))" radius={[4, 4, 0, 0]} name="expense" />
              <Bar dataKey="income" fill="hsl(var(--income))" radius={[4, 4, 0, 0]} name="income" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-4 mt-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-expense" />
            <span className="text-xs text-muted-foreground">Expense</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-income" />
            <span className="text-xs text-muted-foreground">Income</span>
          </div>
        </div>
      </div>

      {/* Top Spending Categories */}
      {analytics.topCategories.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Top Spending</h3>
          <div className="space-y-3">
            {analytics.topCategories.map((cat, index) => {
              const maxValue = analytics.topCategories[0]?.value || 1;
              const percentage = (cat.value / maxValue) * 100;
              return (
                <div key={cat.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium capitalize truncate max-w-[60%]">{cat.name}</span>
                    <span className="font-mono text-sm text-muted-foreground">
                      {currencySymbol}{formatAmount(cat.value)}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${percentage}%`,
                        backgroundColor: categoryColors[index % categoryColors.length]
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Needs vs Wants Pie */}
      {pieData.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Needs vs Wants</h3>
          <div className="flex items-center gap-4">
            <div className="w-28 h-28">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={28}
                    outerRadius={48}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2">
              {pieData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-2.5 h-2.5 rounded-full" 
                      style={{ backgroundColor: item.color }} 
                    />
                    <span className="text-sm">{item.name}</span>
                  </div>
                  <span className="font-mono text-sm">
                    {currencySymbol}{formatAmount(item.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* By Payment Mode */}
      {analytics.byMode.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">By Payment Mode</h3>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.byMode} layout="vertical">
                <XAxis type="number" hide />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  width={70}
                />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number) => [`${currencySymbol}${formatAmount(value)}`, 'Spent']}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {analytics.byMode.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={modeColors[index % modeColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Monthly Trend with Savings */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-4">6 Month Overview</h3>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={analytics.monthlyTrend}>
              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value: number, name: string) => {
                  const labels: Record<string, string> = {
                    income: 'Income',
                    expense: 'Expense',
                    savings: 'Savings',
                  };
                  return [`${currencySymbol}${formatAmount(value)}`, labels[name] || name];
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
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 3 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-4 mt-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-income" />
            <span className="text-xs text-muted-foreground">Income</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-expense" />
            <span className="text-xs text-muted-foreground">Expense</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-0 border-t-2 border-dashed border-primary" />
            <span className="text-xs text-muted-foreground">Savings</span>
          </div>
        </div>
      </div>

      {/* Last Month Comparison */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Last Month</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-bold font-mono text-foreground">
              {currencySymbol}{formatAmount(analytics.lastMonthTotal)}
            </p>
            <p className="text-xs text-muted-foreground">Total spent</p>
          </div>
          <div className={cn(
            "px-3 py-1.5 rounded-full text-sm font-medium",
            analytics.percentChange <= 0 
              ? "bg-income/15 text-income" 
              : "bg-expense/15 text-expense"
          )}>
            {analytics.percentChange <= 0 ? '↓' : '↑'} {Math.abs(analytics.percentChange).toFixed(0)}%
          </div>
        </div>
      </div>
    </div>
  );
}
