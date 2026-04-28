"use server";

import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import type { AuthError } from "@supabase/supabase-js";

/** Mevcut e-posta ile kayıt denemesi — oturum da açılmaz; kullanıcıya açıkça söylenir. */
const SIGN_UP_EMAIL_TAKEN =
  "Bu adrese yeni kayıt oluşturulmadı ve oturum açılmadı; bu e-posta zaten kayıtlı. Şifrenizle giriş yapmayı deneyin.";

function mapSignUpError(error: AuthError): string {
  const code = error.code ?? "";
  const msg = error.message.toLowerCase();

  if (
    code === "user_already_exists" ||
    msg.includes("already been registered") ||
    msg.includes("user already registered") ||
    msg.includes("email address is already")
  ) {
    return SIGN_UP_EMAIL_TAKEN;
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

  const admin = getAdminClient();
  if (admin) {
    const { data: exists, error: rpcError } = await admin.rpc(
      "auth_email_exists",
      { email_input: email }
    );
    if (rpcError) {
      console.error("auth_email_exists RPC:", rpcError.message);
    } else if (exists === true) {
      return { error: SIGN_UP_EMAIL_TAKEN, duplicateEmail: true };
    }
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
    },
  });

  if (error) {
    const mapped = mapSignUpError(error);
    return mapped === SIGN_UP_EMAIL_TAKEN
      ? { error: mapped, duplicateEmail: true }
      : { error: mapped };
  }

  if (!data.user) {
    return { error: "Kayıt tamamlanamadı. Lütfen tekrar deneyin." };
  }

  // Confirm e-mail açıksa Supabase bazen hata vermeden "sahte" kullanıcı döner;
  // yeni kayıtta en az bir identity olmalı (boş/eksik = mevcut e-posta veya obfuscation).
  const identities = data.user.identities;
  if (!identities?.length) {
    return {
      error: SIGN_UP_EMAIL_TAKEN,
      duplicateEmail: true,
    };
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
