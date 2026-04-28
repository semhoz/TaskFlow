"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { AuthError } from "@supabase/supabase-js";

function mapSignUpError(error: AuthError): string {
  const code = error.code ?? "";
  const msg = error.message.toLowerCase();

  if (
    code === "user_already_exists" ||
    msg.includes("already been registered") ||
    msg.includes("user already registered") ||
    msg.includes("email address is already")
  ) {
    return "Bu e-posta adresi zaten kayıtlı.";
  }

  return error.message;
}

export async function signUp(formData: FormData) {
  const supabase = await createClient();

  const emailRaw = formData.get("email") as string;
  const email = emailRaw.trim().toLowerCase();
  const password = formData.get("password") as string;
  const fullName = (formData.get("fullName") as string).trim();

  if (!email || !password) {
    return { error: "E-posta ve şifre gerekli." };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
    },
  });

  if (error) {
    return { error: mapSignUpError(error) };
  }

  // Confirm e-mail açıksa Supabase, e-posta sızdırmayı önlemek için bazen hata döndürmeden
  // identities dizisi boş bir user döner (sıfırdan kayıtta en az bir kimlik olmalı).
  if (data.user?.identities?.length === 0) {
    return {
      error:
        "Bu e-posta adresi zaten kayıtlı veya onay bekliyor. Giriş yapmayı deneyin.",
    };
  }

  if (!data.user) {
    return { error: "Kayıt tamamlanamadı. Lütfen tekrar deneyin." };
  }

  redirect("/dashboard");
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();

  const email = (formData.get("email") as string).trim().toLowerCase();
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
