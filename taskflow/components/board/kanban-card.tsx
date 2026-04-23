"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { CardWithLabels } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Calendar, User } from "lucide-react";
import { format, isPast, isToday } from "date-fns";

interface KanbanCardProps {
  card: CardWithLabels;
  onClick?: () => void;
  isOverlay?: boolean;
}

export function KanbanCard({ card, onClick, isOverlay }: KanbanCardProps) {
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
    opacity: isDragging ? 0.4 : 1,
  };

  const dueDateObj = card.due_date ? new Date(card.due_date) : null;
  const isOverdue = dueDateObj && isPast(dueDateObj) && !isToday(dueDateObj);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`cursor-pointer rounded-lg border bg-card p-3 shadow-sm transition-shadow hover:shadow-md ${
        isDragging ? "shadow-lg ring-2 ring-primary/20" : ""
      } ${isOverlay ? "shadow-xl" : ""}`}
    >
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
    </div>
  );
}
