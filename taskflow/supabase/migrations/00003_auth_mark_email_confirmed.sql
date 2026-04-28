-- E-postayı GoTrue üzerinden onaylatmak (updateUserById vb.) bazen gönderim kotasına takılabilir.
-- Bu fonksiyon auth.users satırını doğrudan günceller; e-posta gönderilmez.

create or replace function public.auth_mark_email_confirmed(email_input text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update auth.users u
  set email_confirmed_at = coalesce(u.email_confirmed_at, timezone('utc'::text, now()))
  where lower(trim(coalesce(u.email, ''))) = lower(trim(coalesce(email_input, '')))
    and u.email_confirmed_at is null;
end;
$$;

revoke all on function public.auth_mark_email_confirmed(text) from public;
grant execute on function public.auth_mark_email_confirmed(text) to service_role;
