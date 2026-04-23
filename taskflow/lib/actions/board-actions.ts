"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Board, BoardWithColumns } from "@/lib/types";

export async function getBoards(): Promise<Board[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("boards")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getBoard(boardId: string): Promise<BoardWithColumns | null> {
  const supabase = await createClient();

  const { data: board, error: boardError } = await supabase
    .from("boards")
    .select("*")
    .eq("id", boardId)
    .single();

  if (boardError || !board) return null;

  const { data: columns, error: colError } = await supabase
    .from("columns")
    .select("*")
    .eq("board_id", boardId)
    .order("position", { ascending: true });

  if (colError) throw new Error(colError.message);

  const { data: labels, error: labelError } = await supabase
    .from("labels")
    .select("*")
    .eq("board_id", boardId);

  if (labelError) throw new Error(labelError.message);

  const columnIds = (columns ?? []).map((c) => c.id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let cards: any[] = [];
  if (columnIds.length > 0) {
    const { data: cardsData, error: cardsError } = await supabase
      .from("cards")
      .select("*")
      .in("column_id", columnIds)
      .order("position", { ascending: true });

    if (cardsError) throw new Error(cardsError.message);
    cards = cardsData ?? [];
  }

  const cardIds = cards.map((c: { id: string }) => c.id);
  let cardLabels: Array<{ card_id: string; label_id: string }> = [];
  if (cardIds.length > 0) {
    const { data: clData, error: clError } = await supabase
      .from("card_labels")
      .select("*")
      .in("card_id", cardIds);

    if (clError) throw new Error(clError.message);
    cardLabels = clData ?? [];
  }

  const labelsMap = new Map((labels ?? []).map((l) => [l.id, l]));

  const cardsWithLabels = cards.map((card) => {
    const cardLabelIds = cardLabels
      .filter((cl) => cl.card_id === card.id)
      .map((cl) => cl.label_id);
    return {
      ...card,
      labels: cardLabelIds
        .map((id: string) => labelsMap.get(id))
        .filter(Boolean),
    };
  });

  const columnsWithCards = (columns ?? []).map((col) => ({
    ...col,
    cards: cardsWithLabels.filter((c) => c.column_id === col.id),
  }));

  return {
    ...board,
    columns: columnsWithCards,
    labels: labels ?? [],
  } as BoardWithColumns;
}

export async function createBoard(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;

  const { data, error } = await supabase
    .from("boards")
    .insert({ title, description, user_id: user.id })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { data };
}

export async function updateBoard(boardId: string, formData: FormData) {
  const supabase = await createClient();

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;

  const { error } = await supabase
    .from("boards")
    .update({ title, description, updated_at: new Date().toISOString() })
    .eq("id", boardId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/board/${boardId}`);
  return { success: true };
}

export async function deleteBoard(boardId: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("boards").delete().eq("id", boardId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { success: true };
}
