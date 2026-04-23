"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { safeGenerateKeyBetween } from "@/lib/position";

export async function createCard(
  columnId: string,
  title: string,
  boardId: string
) {
  const supabase = await createClient();

  const { data: lastCard } = await supabase
    .from("cards")
    .select("position")
    .eq("column_id", columnId)
    .order("position", { ascending: false })
    .limit(1)
    .single();

  const position = safeGenerateKeyBetween(lastCard?.position ?? null, null);

  const { data, error } = await supabase
    .from("cards")
    .insert({ column_id: columnId, title, position })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/board/${boardId}`);
  return { data };
}

export async function updateCard(
  cardId: string,
  updates: {
    title?: string;
    description?: string | null;
    assignee?: string | null;
    due_date?: string | null;
  },
  boardId: string
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("cards")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", cardId);

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/board/${boardId}`);
  return { success: true };
}

export async function deleteCard(cardId: string, boardId: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("cards").delete().eq("id", cardId);

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/board/${boardId}`);
  return { success: true };
}

export async function moveCard(
  cardId: string,
  newColumnId: string,
  boardId: string,
  prevPosition: string | null,
  nextPosition: string | null
) {
  const supabase = await createClient();

  const newPosition = safeGenerateKeyBetween(prevPosition, nextPosition);

  const { error } = await supabase
    .from("cards")
    .update({
      column_id: newColumnId,
      position: newPosition,
      updated_at: new Date().toISOString(),
    })
    .eq("id", cardId);

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/board/${boardId}`);
  return { success: true, position: newPosition };
}

export async function toggleCardLabel(
  cardId: string,
  labelId: string,
  boardId: string,
  isAdding: boolean
) {
  const supabase = await createClient();

  if (isAdding) {
    const { error } = await supabase
      .from("card_labels")
      .insert({ card_id: cardId, label_id: labelId });

    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("card_labels")
      .delete()
      .eq("card_id", cardId)
      .eq("label_id", labelId);

    if (error) return { error: error.message };
  }

  revalidatePath(`/dashboard/board/${boardId}`);
  return { success: true };
}
