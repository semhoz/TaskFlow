"use server";

import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import type { AuthError, SupabaseClient } from "@supabase/supabase-js";

/** Mevcut e-posta ile kayıt denemesi — oturum da açılmaz; kullanıcıya açıkça söylenir. */
const SIGN_UP_EMAIL_TAKEN =
  "Bu adrese yeni kayıt oluşturulmadı ve oturum açılmadı; bu e-posta zaten kayıtlı. Şifrenizle giriş yapmayı deneyin.";

const SIGN_UP_NEEDS_SERVICE_ROLE =
  "Kayıt için sunucuda SUPABASE_SERVICE_ROLE_KEY tanımlı olmalı. .env veya barındırma (ör. Vercel) ortam değişkenlerine ekleyin.";

function formatAuthError(error: AuthError): string {
  if (
    error.code === "over_email_send_rate_limit" ||
    error.message.toLowerCase().includes("email rate limit")
  ) {
    return (
      "E-posta gönderim kotası doldu (Supabase sınırı). Bir süre sonra tekrar deneyin. " +
      "Geliştirme için: Supabase → Authentication → Providers → Email → Confirm email kapatın; " +
      "üretimde özel SMTP veya daha yüksek kota kullanın."
    );
  }
  return error.message;
}

function isEmailNotConfirmedError(error: AuthError): boolean {
  if (error.code === "email_not_confirmed") return true;
  return error.message.toLowerCase().includes("email not confirmed");
}

/** Onaysız hesap: GoTrue admin (updateUser) e-posta kotasına yol açabilir; RPC yalnızca DB günceller. */
async function signInWithOptionalEmailConfirm(
  supabase: SupabaseClient,
  admin: SupabaseClient | null,
  email: string,
  password: string
): Promise<{ error: AuthError | null }> {
  let { error } = await supabase.auth.signInWithPassword({ email, password });

  if (!error || !admin || !isEmailNotConfirmedError(error)) {
    return { error };
  }

  const { error: rpcError } = await admin.rpc("auth_mark_email_confirmed", {
    email_input: email,
  });
  if (rpcError) {
    console.error("auth_mark_email_confirmed:", rpcError.message);
    return { error };
  }

  ({ error } = await supabase.auth.signInWithPassword({ email, password }));
  return { error };
}

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
  if (!admin) {
    return { error: SIGN_UP_NEEDS_SERVICE_ROLE };
  }

  const { data: exists, error: rpcError } = await admin.rpc(
    "auth_email_exists",
    { email_input: email }
  );
  if (rpcError) {
    console.error("auth_email_exists RPC:", rpcError.message);
  } else if (exists === true) {
    return { error: SIGN_UP_EMAIL_TAKEN, duplicateEmail: true };
  }

  // Admin API onay e-postası göndermez; email_confirm ile hesap hemen girişe uygundur.
  const { data: created, error: createError } =
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

  if (createError) {
    const e = createError as AuthError;
    const mapped = mapSignUpError(e);
    return mapped === SIGN_UP_EMAIL_TAKEN
      ? { error: mapped, duplicateEmail: true }
      : { error: formatAuthError(e) };
  }

  const newUser = created.user;
  if (newUser?.id && !newUser.email_confirmed_at) {
    const { error: rpcError } = await admin.rpc("auth_mark_email_confirmed", {
      email_input: email,
    });
    if (rpcError) {
      console.error("Kayıt sonrası e-posta onayı (RPC):", rpcError.message);
    }
  }

  const { error: signInError } = await signInWithOptionalEmailConfirm(
    supabase,
    admin,
    email,
    password
  );

  if (signInError) {
    return { error: formatAuthError(signInError) };
  }

  redirect("/dashboard");
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();
  const admin = getAdminClient();

  const email = (formData.get("email") as string).trim().toLowerCase();
  const password = formData.get("password") as string;

  const { error } = await signInWithOptionalEmailConfirm(
    supabase,
    admin,
    email,
    password
  );

  if (error) {
    return { error: formatAuthError(error) };
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
