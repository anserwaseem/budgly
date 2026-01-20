import { useCallback, useMemo, useState } from "react";
import {
  DndContext,
  closestCenter,
  DragCancelEvent,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { cn, haptic } from "@/lib/utils";
import { SortableDashboardCard } from "@/components/SortableDashboardCard";
import type { DashboardCardId } from "../types";

interface DashboardSortableGridProps {
  ids: DashboardCardId[];
  isFullWidth: (id: DashboardCardId) => boolean;
  renderCard: (id: DashboardCardId) => React.ReactElement | null;
  onReorder: (newOrder: DashboardCardId[]) => void;
}

export function DashboardSortableGrid({
  ids,
  isFullWidth,
  renderCard,
  onReorder,
}: DashboardSortableGridProps) {
  const [activeId, setActiveId] = useState<DashboardCardId | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // iOS-friendly: avoid accidental drags while scrolling
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as DashboardCardId);
    haptic("medium");
  }, []);

  const handleDragCancel = useCallback((_event: DragCancelEvent) => {
    setActiveId(null);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over || active.id === over.id) {
        setActiveId(null);
        return;
      }

      const oldIndex = ids.indexOf(active.id as DashboardCardId);
      const newIndex = ids.indexOf(over.id as DashboardCardId);

      if (oldIndex === -1 || newIndex === -1) {
        setActiveId(null);
        return;
      }

      const newIds = arrayMove(ids, oldIndex, newIndex) as DashboardCardId[];
      onReorder(newIds);
      haptic("light");
      setActiveId(null);
    },
    [ids, onReorder]
  );

  const overlay = useMemo(() => {
    if (!activeId) return null;
    const content = renderCard(activeId);
    if (!content) return null;
    return (
      <div
        className={cn(
          "relative pointer-events-none rounded-xl",
          "shadow-2xl shadow-black/40 ring-1 ring-border/60",
          "scale-[1.02]"
        )}
      >
        {content}
      </div>
    );
  }, [activeId, renderCard]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext items={ids} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {ids.map((id) => {
            const content = renderCard(id);
            if (!content) return null;
            return (
              <SortableDashboardCard
                key={id}
                id={id}
                className={isFullWidth(id) ? "col-span-2" : ""}
              >
                {content}
              </SortableDashboardCard>
            );
          })}
        </div>
      </SortableContext>

      <DragOverlay>{overlay}</DragOverlay>
    </DndContext>
  );
}

