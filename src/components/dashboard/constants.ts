export const MODE_COLORS = [
  "hsl(158, 55%, 50%)",
  "hsl(190, 65%, 50%)",
  "hsl(35, 85%, 55%)",
  "hsl(265, 50%, 60%)",
  "hsl(0, 60%, 55%)",
] as const;

export const CATEGORY_COLORS = [
  "hsl(var(--primary))",
  "hsl(190, 65%, 50%)",
  "hsl(35, 85%, 55%)",
  "hsl(265, 50%, 60%)",
  "hsl(158, 55%, 50%)",
] as const;

export const PIE_CHART_COLORS = {
  needs: "hsl(190, 65%, 50%)",
  wants: "hsl(35, 85%, 55%)",
  other: "hsl(220, 15%, 40%)",
} as const;
