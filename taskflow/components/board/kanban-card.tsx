"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { CardWithLabels } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Calendar, GripVertical, User } from "lucide-react";
import { format, isPast, isToday } from "date-fns";

interface KanbanCardProps {
  card: CardWithLabels;
  /** When true (typically mobile), only the grip starts a drag so the rest of the card scrolls normally */
  dragHandleOnly?: boolean;
  onClick?: () => void;
  isOverlay?: boolean;
}

export function KanbanCard({
  card,
  dragHandleOnly = false,
  onClick,
  isOverlay,
}: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    data: { type: "card", card },
    disabled: isOverlay,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  };

  const dueDateObj = card.due_date ? new Date(card.due_date) : null;
  const isOverdue = dueDateObj && isPast(dueDateObj) && !isToday(dueDateObj);

  const showHandle = dragHandleOnly && !isOverlay;

  const content = (
    <>
      {card.labels.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {card.labels.map((label) => (
            <span
              key={label.id}
              className="inline-block h-2 w-8 rounded-full"
              style={{ backgroundColor: label.color }}
              title={label.name}
            />
          ))}
        </div>
      )}

      <p className="text-sm font-medium leading-snug">{card.title}</p>

      {card.description && (
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
          {card.description}
        </p>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {dueDateObj && (
          <Badge
            variant={isOverdue ? "destructive" : "secondary"}
            className="gap-1 text-[10px]"
          >
            <Calendar className="size-3" />
            {format(dueDateObj, "MMM d")}
          </Badge>
        )}
        {card.assignee && (
          <Badge variant="secondary" className="gap-1 text-[10px]">
            <User className="size-3" />
            {card.assignee}
          </Badge>
        )}
      </div>
    </>
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...(showHandle ? {} : listeners)}
      onClick={showHandle ? undefined : onClick}
      className={`rounded-lg border bg-card p-3 shadow-sm transition-shadow hover:shadow-md ${
        showHandle ? "cursor-default" : "cursor-pointer touch-manipulation select-none"
      } ${isDragging ? "pointer-events-none" : ""} ${isOverlay ? "shadow-xl" : ""}`}
    >
      {showHandle ? (
        <div className="flex gap-1">
          <button
            type="button"
            className="touch-none -m-1 shrink-0 cursor-grab rounded p-1 text-muted-foreground hover:bg-muted/80 active:cursor-grabbing"
            {...listeners}
            aria-label="Kartı taşı"
          >
            <GripVertical className="size-4" />
          </button>
          <div
            className="min-w-0 flex-1 cursor-pointer touch-manipulation select-none"
            onClick={onClick}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.();
              }
            }}
            role="button"
            tabIndex={0}
          >
            {content}
          </div>
        </div>
      ) : (
        content
      )}
    </div>
  );
}
