"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createLabel(
  boardId: string,
  name: string,
  color: string
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("labels")
    .insert({ board_id: boardId, name, color })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/board/${boardId}`);
  return { data };
}

export async function updateLabel(
  labelId: string,
  name: string,
  color: string,
  boardId: string
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("labels")
    .update({ name, color })
    .eq("id", labelId);

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/board/${boardId}`);
  return { success: true };
}

export async function deleteLabel(labelId: string, boardId: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("labels").delete().eq("id", labelId);

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/board/${boardId}`);
  return { success: true };
}
