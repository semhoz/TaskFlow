"use client";

import { useState } from "react";
import { createColumn } from "@/lib/actions/column-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import type { ColumnWithCards } from "@/lib/types";

interface NewColumnFormProps {
  boardId: string;
  onColumnCreated: (column: ColumnWithCards) => void;
}

export function NewColumnForm({ boardId, onColumnCreated }: NewColumnFormProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    const result = await createColumn(boardId, title.trim());

    if (result.error) {
      toast.error(result.error);
    } else if (result.data) {
      onColumnCreated({ ...result.data, cards: [] } as ColumnWithCards);
      setTitle("");
      setIsAdding(false);
    }
    setLoading(false);
  }

  if (!isAdding) {
    return (
      <button
        onClick={() => setIsAdding(true)}
        className="flex h-fit w-72 shrink-0 items-center gap-2 rounded-xl border-2 border-dashed border-muted-foreground/25 p-4 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
      >
        <Plus className="size-4" />
        Add column
      </button>
    );
  }

  return (
    <div className="w-72 shrink-0 rounded-xl border bg-muted/30 p-3">
      <form onSubmit={handleSubmit} className="space-y-2">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Column title..."
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setIsAdding(false);
              setTitle("");
            }
          }}
        />
        <div className="flex gap-1">
          <Button type="submit" size="sm" disabled={loading || !title.trim()}>
            {loading ? "Adding..." : "Add Column"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              setIsAdding(false);
              setTitle("");
            }}
          >
            <X className="size-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
