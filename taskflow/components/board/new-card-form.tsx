"use client";

import { useState } from "react";
import { createCard } from "@/lib/actions/card-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import type { CardWithLabels } from "@/lib/types";

interface NewCardFormProps {
  columnId: string;
  boardId: string;
  onCardCreated: (columnId: string, card: CardWithLabels) => void;
}

export function NewCardForm({
  columnId,
  boardId,
  onCardCreated,
}: NewCardFormProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    const result = await createCard(columnId, title.trim(), boardId);

    if (result.error) {
      toast.error(result.error);
    } else if (result.data) {
      onCardCreated(columnId, { ...result.data, labels: [] } as CardWithLabels);
      setTitle("");
    }
    setLoading(false);
  }

  if (!isAdding) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start text-muted-foreground"
        onClick={() => setIsAdding(true)}
      >
        <Plus className="mr-1 size-4" />
        Add card
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Card title..."
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
          {loading ? "Adding..." : "Add"}
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
  );
}
