import { formatAmount } from '@/lib/parser';
import { cn } from '@/lib/utils';

interface StatsBarProps {
  stats: {
    totalExpenses: number;
    needsTotal: number;
    wantsTotal: number;
    uncategorized: number;
    transactionCount: number;
  };
}

export function StatsBar({ stats }: StatsBarProps) {
  const needsPercent = stats.totalExpenses > 0 
    ? (stats.needsTotal / stats.totalExpenses) * 100 
    : 0;
  const wantsPercent = stats.totalExpenses > 0 
    ? (stats.wantsTotal / stats.totalExpenses) * 100 
    : 0;

  return (
    <div className="space-y-4">
      {/* Total */}
      <div className="text-center">
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
          This Month
        </p>
        <p className="text-3xl font-bold text-foreground font-mono">
          ₹{formatAmount(stats.totalExpenses)}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {stats.transactionCount} transactions
        </p>
      </div>

      {/* Progress Bar */}
      {stats.totalExpenses > 0 && (
        <div className="space-y-2">
          <div className="h-3 bg-muted rounded-full overflow-hidden flex">
            <div 
              className="h-full bg-need transition-all duration-500"
              style={{ width: `${needsPercent}%` }}
            />
            <div 
              className="h-full bg-want transition-all duration-500"
              style={{ width: `${wantsPercent}%` }}
            />
          </div>

          {/* Legend */}
          <div className="flex justify-between text-xs">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-need" />
                <span className="text-muted-foreground">Needs</span>
                <span className={cn("font-mono font-medium", stats.needsTotal > 0 && "text-need")}>
                  ₹{formatAmount(stats.needsTotal)}
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-want" />
                <span className="text-muted-foreground">Wants</span>
                <span className={cn("font-mono font-medium", stats.wantsTotal > 0 && "text-want")}>
                  ₹{formatAmount(stats.wantsTotal)}
                </span>
              </span>
            </div>
            {stats.uncategorized > 0 && (
              <span className="text-muted-foreground">
                ₹{formatAmount(stats.uncategorized)} uncategorized
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
