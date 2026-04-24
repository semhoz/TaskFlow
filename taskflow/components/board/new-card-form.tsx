"use client";

import { useState } from "react";
import { createCard } from "@/lib/actions/card-actions";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import type { CardWithLabels } from "@/lib/types";

const NEW_CARD_PLACEHOLDER_TITLE = "New card";

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
  const [loading, setLoading] = useState(false);

  async function handleAdd() {
    setLoading(true);
    const result = await createCard(
      columnId,
      NEW_CARD_PLACEHOLDER_TITLE,
      boardId
    );

    if (result.error) {
      toast.error(result.error);
    } else if (result.data) {
      onCardCreated(columnId, { ...result.data, labels: [] } as CardWithLabels);
    }
    setLoading(false);
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="w-full justify-start text-muted-foreground"
      onClick={handleAdd}
      disabled={loading}
    >
      <Plus className="mr-1 size-4" />
      {loading ? "Adding..." : "Add card"}
    </Button>
  );
}
