import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface InsightCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  subtitle: string;
  iconClassName?: string;
  valueClassName?: string;
}

export function InsightCard({
  icon: Icon,
  label,
  value,
  subtitle,
  iconClassName,
  valueClassName = "text-foreground",
}: InsightCardProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-3 sm:p-4">
      <div className="flex items-center gap-1.5 text-muted-foreground mb-1.5">
        <Icon className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0", iconClassName)} />
        <span className="text-[10px] sm:text-xs uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className={cn("text-base sm:text-xl font-bold font-mono", valueClassName)}>
        {value}
      </p>
      <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
        {subtitle}
      </p>
    </div>
  );
}
