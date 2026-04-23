"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { safeGenerateKeyBetween } from "@/lib/position";

export async function createColumn(boardId: string, title: string) {
  const supabase = await createClient();

  const { data: lastColumn } = await supabase
    .from("columns")
    .select("position")
    .eq("board_id", boardId)
    .order("position", { ascending: false })
    .limit(1)
    .single();

  const position = safeGenerateKeyBetween(lastColumn?.position ?? null, null);

  const { data, error } = await supabase
    .from("columns")
    .insert({ board_id: boardId, title, position })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/board/${boardId}`);
  return { data };
}

export async function updateColumn(columnId: string, title: string, boardId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("columns")
    .update({ title })
    .eq("id", columnId);

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/board/${boardId}`);
  return { success: true };
}

export async function deleteColumn(columnId: string, boardId: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("columns").delete().eq("id", columnId);

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/board/${boardId}`);
  return { success: true };
}

export async function moveColumn(
  columnId: string,
  boardId: string,
  prevPosition: string | null,
  nextPosition: string | null
) {
  const supabase = await createClient();

  const newPosition = safeGenerateKeyBetween(prevPosition, nextPosition);

  const { error } = await supabase
    .from("columns")
    .update({ position: newPosition })
    .eq("id", columnId);

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/board/${boardId}`);
  return { success: true, position: newPosition };
}
