-- Sunucu tarafı (service role) ile sign-up öncesi e-posta tekrarını tespit etmek için.
-- Supabase Auth, "e-posta onayı" açıkken mevcut kullanıcıda hata döndürmeyebilir; bu RPC ek güvence sağlar.

create or replace function public.auth_email_exists(email_input text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from auth.users
    where lower(trim(coalesce(email, ''))) = lower(trim(coalesce(email_input, '')))
  );
$$;

revoke all on function public.auth_email_exists(text) from public;
grant execute on function public.auth_email_exists(text) to service_role;
