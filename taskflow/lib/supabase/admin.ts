import { createClient, SupabaseClient } from "@supabase/supabase-js";

/** Sadece sunucuda; service_role anahtarı istemciye verilmemeli. */
export function getAdminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
