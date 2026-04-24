"use client";

import { useState, useRef, useEffect } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ColumnWithCards, CardWithLabels } from "@/lib/types";
import { KanbanCard } from "./kanban-card";
import { NewCardForm } from "./new-card-form";
import { deleteColumn, updateColumn } from "@/lib/actions/column-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GripVertical, MoreHorizontal, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";

interface KanbanColumnProps {
  column: ColumnWithCards;
  boardId: string;
  /** Touch devices: drag cards only from handle so scrolling/swiping between columns stays clean */
  touchDragHandle?: boolean;
  onCardCreated: (columnId: string, card: CardWithLabels) => void;
  onCardClick: (card: CardWithLabels, columnId: string) => void;
  onColumnDeleted: (columnId: string) => void;
  onColumnRenamed: (columnId: string, title: string) => void;
}

export function KanbanColumn({
  column,
  boardId,
  touchDragHandle = false,
  onCardCreated,
  onCardClick,
  onColumnDeleted,
  onColumnRenamed,
}: KanbanColumnProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(column.title);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: { type: "column", column },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const cardIds = column.cards.map((c) => c.id);

  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  async function handleRename() {
    const newTitle = title.trim();
    if (!newTitle || newTitle === column.title) {
      setTitle(column.title);
      setIsEditing(false);
      return;
    }

    setIsEditing(false);
    onColumnRenamed(column.id, newTitle);

    const result = await updateColumn(column.id, newTitle, boardId);
    if (result.error) {
      toast.error(result.error);
      setTitle(column.title);
      onColumnRenamed(column.id, column.title);
    }
  }

  async function handleDelete() {
    onColumnDeleted(column.id);
    const result = await deleteColumn(column.id, boardId);
    if (result.error) {
      toast.error(result.error);
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex w-72 shrink-0 flex-col rounded-xl border bg-muted/30"
    >
      <div className="flex items-center gap-1 p-3 pb-2">
        <button
          className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>

        {isEditing ? (
          <Input
            ref={inputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRename();
              if (e.key === "Escape") {
                setTitle(column.title);
                setIsEditing(false);
              }
            }}
            className="h-7 text-sm font-semibold"
          />
        ) : (
          <h3 className="flex-1 truncate text-sm font-semibold">
            {column.title}
          </h3>
        )}

        <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {column.cards.length}
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-xs" />}>
            <MoreHorizontal className="size-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setIsEditing(true)}>
              <Pencil className="mr-2 size-3.5" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={handleDelete}
            >
              <Trash2 className="mr-2 size-3.5" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Dikey kaydırma: sayfa (main) — iç içe scroll yok; mobil + masaüstü */}
      <div className="flex flex-col gap-2 px-3 pb-2">
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          {column.cards.map((card) => (
            <KanbanCard
              key={card.id}
              card={card}
              dragHandleOnly={touchDragHandle}
              onClick={() => onCardClick(card, column.id)}
            />
          ))}
        </SortableContext>
      </div>

      <div className="border-t p-2">
        <NewCardForm
          columnId={column.id}
          boardId={boardId}
          onCardCreated={onCardCreated}
        />
      </div>
    </div>
  );
}
