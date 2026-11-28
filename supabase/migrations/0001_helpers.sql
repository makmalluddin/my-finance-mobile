-- 0001_helpers.sql
-- Helper umum untuk RPC dan trigger. Semua fungsi berjalan sebagai invoker
-- agar RLS tetap berlaku.

create extension if not exists pgtap with schema extensions;

create or replace function public.raise_app_error(p_code text, p_detail jsonb default null)
returns void
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if p_detail is null then
    raise exception '%', p_code;
  else
    raise exception '%', p_code using detail = p_detail::text;
  end if;
end;
$$;

create or replace function public.require_user()
returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    perform public.raise_app_error('UNAUTHENTICATED');
  end if;
  return v_user;
end;
$$;

create or replace function public.is_valid_timezone(p_timezone text)
returns boolean
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from pg_catalog.pg_timezone_names tz
    where tz.name = p_timezone
  );
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.raise_app_error(text, jsonb) from public, anon;
revoke all on function public.require_user() from public, anon;
revoke all on function public.is_valid_timezone(text) from public, anon;
revoke all on function public.set_updated_at() from public, anon;

grant execute on function public.raise_app_error(text, jsonb) to authenticated;
grant execute on function public.require_user() to authenticated;
grant execute on function public.is_valid_timezone(text) to authenticated;
grant execute on function public.set_updated_at() to authenticated;
