"use client";

import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  closestCorners,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
  type CollisionDetection,
  type UniqueIdentifier,
  MeasuringStrategy,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { safeGenerateKeyBetween } from "@/lib/position";
import type {
  BoardWithColumns,
  ColumnWithCards,
  CardWithLabels,
} from "@/lib/types";
import { KanbanColumn } from "./kanban-column";
import { KanbanCard } from "./kanban-card";
import { NewColumnForm } from "./new-column-form";
import { CardDetailModal } from "./card-detail-modal";
import { moveCard } from "@/lib/actions/card-actions";
import { moveColumn } from "@/lib/actions/column-actions";
import { toast } from "sonner";
import { BoardSkeleton } from "./board-skeleton";

export function BoardView({ board }: { board: BoardWithColumns }) {
  const [mounted, setMounted] = useState(false);
  /** Touch-primary devices: delay activation so vertical/horizontal scroll can win; avoid stacking TouchSensor + PointerSensor (double handling on mobile). */
  const [touchPrimary, setTouchPrimary] = useState(false);

  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia("(hover: none) and (pointer: coarse)");
    const sync = () => setTouchPrimary(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  const [columns, setColumns] = useState<ColumnWithCards[]>(board.columns);
  const [activeCard, setActiveCard] = useState<CardWithLabels | null>(null);
  const [activeColumn, setActiveColumn] = useState<ColumnWithCards | null>(null);
  const [selectedCard, setSelectedCard] = useState<CardWithLabels | null>(null);
  const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null);
  const prevColumnsRef = useRef<ColumnWithCards[]>(board.columns);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: touchPrimary
        ? { delay: 350, tolerance: 16 }
        : { distance: 8 },
    })
  );

  const columnIds = useMemo(() => columns.map((c) => c.id), [columns]);

  // Derive column vs card drag from active id so collision detection is correct on frame 1.
  // For cards, closestCorners tracks vertical reordering; pointerWithin often keeps "over"
  // on the top card while the pointer is still inside its tall hit box.
  const collisionDetection: CollisionDetection = useCallback(
    (args) => {
      const activeId = args.active.id as string;
      if (columnIds.includes(activeId)) {
        return closestCenter({
          ...args,
          droppableContainers: args.droppableContainers.filter((c) =>
            columnIds.includes(c.id as string)
          ),
        });
      }

      return closestCorners(args);
    },
    [columnIds]
  );

  function findColumnOfCard(cardId: UniqueIdentifier): ColumnWithCards | undefined {
    return columns.find((c) => c.cards.some((card) => card.id === cardId));
  }

  function findCard(id: UniqueIdentifier): CardWithLabels | undefined {
    for (const col of columns) {
      const card = col.cards.find((c) => c.id === id);
      if (card) return card;
    }
    return undefined;
  }

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      prevColumnsRef.current = columns.map((c) => ({
        ...c,
        cards: [...c.cards],
      }));

      // Check if it's a column
      if (columns.some((c) => c.id === active.id)) {
        setActiveColumn(columns.find((c) => c.id === active.id) || null);
        return;
      }

      // It's a card
      const card = findCard(active.id);
      if (card) {
        setActiveCard(card);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [columns]
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      // Column drags: only handled in onDragEnd. Card drags: active id is never a column id.
      if (columns.some((c) => c.id === event.active.id)) return;

      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const activeCol = findColumnOfCard(active.id);
      if (!activeCol) return;

      // Determine the target column
      let overCol: ColumnWithCards | undefined;
      // Is the over target a column itself?
      const isOverColumn = columns.some((c) => c.id === over.id);
      if (isOverColumn) {
        overCol = columns.find((c) => c.id === over.id);
      } else {
        overCol = findColumnOfCard(over.id);
      }

      if (!overCol || activeCol.id === overCol.id) return;

      setColumns((prev) => {
        const sourceCol = prev.find((c) => c.id === activeCol.id)!;
        const destCol = prev.find((c) => c.id === overCol.id)!;

        const activeCardIndex = sourceCol.cards.findIndex(
          (c) => c.id === active.id
        );
        if (activeCardIndex === -1) return prev;

        const movedCard = sourceCol.cards[activeCardIndex];

        const overCardIndex = destCol.cards.findIndex(
          (c) => c.id === over.id
        );
        const insertIndex =
          overCardIndex >= 0 ? overCardIndex : destCol.cards.length;

        return prev.map((col) => {
          if (col.id === sourceCol.id) {
            return {
              ...col,
              cards: col.cards.filter((c) => c.id !== active.id),
            };
          }
          if (col.id === destCol.id) {
            const newCards = [...col.cards];
            newCards.splice(insertIndex, 0, {
              ...movedCard,
              column_id: destCol.id,
            });
            return { ...col, cards: newCards };
          }
          return col;
        });
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [columns]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      setActiveCard(null);
      setActiveColumn(null);

      if (!over) {
        setColumns(prevColumnsRef.current);
        return;
      }

      // ── Column reorder ──
      if (columns.some((c) => c.id === active.id)) {
        if (active.id === over.id) return;

        const oldIndex = columns.findIndex((c) => c.id === active.id);
        const newIndex = columns.findIndex((c) => c.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return;

        const reordered = arrayMove(columns, oldIndex, newIndex);

        const prevPos = newIndex > 0 ? reordered[newIndex - 1].position : null;
        const nextPos =
          newIndex < reordered.length - 1
            ? reordered[newIndex + 1].position
            : null;

        const newPos = safeGenerateKeyBetween(prevPos, nextPos);
        reordered[newIndex] = { ...reordered[newIndex], position: newPos };

        setColumns(reordered);

        moveColumn(active.id as string, board.id, prevPos, nextPos).then(
          (result) => {
            if (result.error) {
              toast.error("Failed to move column");
              setColumns(prevColumnsRef.current);
            }
          }
        );
        return;
      }

      // ── Card reorder / cross-column move ──
      const finalColumns = columns.map((c) => ({
        ...c,
        cards: [...c.cards],
      }));

      const destCol = finalColumns.find((c) =>
        c.cards.some((card) => card.id === active.id)
      );
      if (!destCol) return;

      const cardIndex = destCol.cards.findIndex((c) => c.id === active.id);
      if (cardIndex === -1) return;

      // Same-column reorder: if over is a different card in same column
      if (active.id !== over.id) {
        const overCardIndex = destCol.cards.findIndex(
          (c) => c.id === over.id
        );
        if (overCardIndex >= 0 && overCardIndex !== cardIndex) {
          const [moved] = destCol.cards.splice(cardIndex, 1);
          destCol.cards.splice(overCardIndex, 0, moved);
        }
      }

      // Compute new position from neighbors
      const finalIndex = destCol.cards.findIndex((c) => c.id === active.id);
      const prevPos =
        finalIndex > 0 ? destCol.cards[finalIndex - 1].position : null;
      const nextPos =
        finalIndex < destCol.cards.length - 1
          ? destCol.cards[finalIndex + 1].position
          : null;

      const newPos = safeGenerateKeyBetween(prevPos, nextPos);
      destCol.cards[finalIndex] = {
        ...destCol.cards[finalIndex],
        position: newPos,
        column_id: destCol.id,
      };

      setColumns(finalColumns);

      moveCard(
        active.id as string,
        destCol.id,
        board.id,
        prevPos,
        nextPos
      ).then((result) => {
        if (result.error) {
          toast.error("Failed to move card");
          setColumns(prevColumnsRef.current);
        }
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [columns, board.id]
  );

  const handleColumnCreated = useCallback(
    (newColumn: ColumnWithCards) => {
      setColumns((prev) => [...prev, newColumn]);
    },
    []
  );

  const handleColumnDeleted = useCallback((columnId: string) => {
    setColumns((prev) => prev.filter((c) => c.id !== columnId));
  }, []);

  const handleColumnRenamed = useCallback(
    (columnId: string, newTitle: string) => {
      setColumns((prev) =>
        prev.map((c) => (c.id === columnId ? { ...c, title: newTitle } : c))
      );
    },
    []
  );

  const handleCardCreated = useCallback(
    (columnId: string, card: CardWithLabels) => {
      setColumns((prev) =>
        prev.map((c) =>
          c.id === columnId ? { ...c, cards: [...c.cards, card] } : c
        )
      );
      setSelectedCard(card);
      setSelectedColumnId(columnId);
    },
    []
  );

  const handleCardClick = useCallback(
    (card: CardWithLabels, columnId: string) => {
      setSelectedCard(card);
      setSelectedColumnId(columnId);
    },
    []
  );

  const handleCardUpdated = useCallback(
    (updatedCard: CardWithLabels) => {
      setColumns((prev) =>
        prev.map((col) => ({
          ...col,
          cards: col.cards.map((c) =>
            c.id === updatedCard.id ? updatedCard : c
          ),
        }))
      );
      setSelectedCard(updatedCard);
    },
    []
  );

  const handleCardDeleted = useCallback((cardId: string) => {
    setColumns((prev) =>
      prev.map((col) => ({
        ...col,
        cards: col.cards.filter((c) => c.id !== cardId),
      }))
    );
    setSelectedCard(null);
    setSelectedColumnId(null);
  }, []);

  if (!mounted) {
    return <BoardSkeleton />;
  }

  return (
    <>
      <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto overscroll-contain p-4 md:overflow-y-hidden md:p-6">
        <DndContext
          id="board-dnd"
          sensors={sensors}
          collisionDetection={collisionDetection}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          measuring={{
            droppable: { strategy: MeasuringStrategy.Always },
          }}
          autoScroll={{
            acceleration: 10,
            threshold: {
              x: 0.12,
              y: 0.12,
            },
          }}
        >
          <SortableContext
            items={columnIds}
            strategy={horizontalListSortingStrategy}
          >
            <div className="flex h-auto gap-4 max-md:items-start md:h-full md:items-stretch">
              {columns.map((column) => (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  boardId={board.id}
                  touchDragHandle={touchPrimary}
                  onCardCreated={handleCardCreated}
                  onCardClick={handleCardClick}
                  onColumnDeleted={handleColumnDeleted}
                  onColumnRenamed={handleColumnRenamed}
                />
              ))}
              <NewColumnForm
                boardId={board.id}
                onColumnCreated={handleColumnCreated}
              />
            </div>
          </SortableContext>

          <DragOverlay dropAnimation={null}>
            {activeCard && (
              <div className="rotate-3 opacity-90">
                <KanbanCard card={activeCard} isOverlay />
              </div>
            )}
            {activeColumn && (
              <div className="rotate-2 opacity-80">
                <div className="w-72 rounded-xl border bg-muted/50 p-3 shadow-xl">
                  <h3 className="text-sm font-semibold">
                    {activeColumn.title}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {activeColumn.cards.length} cards
                  </p>
                </div>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      {selectedCard && selectedColumnId && (
        <CardDetailModal
          card={selectedCard}
          boardId={board.id}
          labels={board.labels}
          onClose={() => {
            setSelectedCard(null);
            setSelectedColumnId(null);
          }}
          onCardUpdated={handleCardUpdated}
          onCardDeleted={handleCardDeleted}
        />
      )}
    </>
  );
}
