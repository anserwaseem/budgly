import { useEffect, useState } from "react";
import { getDashboardLayout } from "@/lib/storage";
import type { DashboardCardId } from "../types";

// Keep in sync with src/lib/storage.ts
const DASHBOARD_LAYOUT_EVENT = "bujit:dashboard-layout-changed";

export function useDashboardLayout() {
  const [layout, setLayout] = useState(() => getDashboardLayout());

  useEffect(() => {
    const handler = () => setLayout(getDashboardLayout());
    window.addEventListener(DASHBOARD_LAYOUT_EVENT, handler);
    return () => {
      window.removeEventListener(DASHBOARD_LAYOUT_EVENT, handler);
    };
  }, []);

  const orderedIds = layout
    .filter((c) => c.visible)
    .sort((a, b) => a.order - b.order)
    .map((c) => c.id as DashboardCardId);

  return { layout, setLayout, orderedIds };
}
