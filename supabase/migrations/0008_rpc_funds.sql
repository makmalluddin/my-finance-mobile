-- 0008_rpc_funds.sql
-- RPC Fund. Semua fungsi SECURITY INVOKER sehingga RLS berlaku.

create or replace function public.rpc_create_fund(
  p_name text,
  p_opening_balance numeric,
  p_fund_type text
)
returns public.funds
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_user uuid := public.require_user();
  v_name text := btrim(coalesce(p_name, ''));
  v_fund public.funds%rowtype;
begin
  if v_name = '' then
    perform public.raise_app_error(
      'VALIDATION_ERROR',
      jsonb_build_object('field', 'name')
    );
  end if;

  if p_opening_balance is null or p_opening_balance < 0 then
    perform public.raise_app_error(
      'INVALID_AMOUNT',
      jsonb_build_object('field', 'opening_balance')
    );
  end if;

  if p_fund_type is null or p_fund_type not in ('active', 'savings_goal') then
    perform public.raise_app_error(
      'INVALID_FUND_TYPE',
      jsonb_build_object('fund_type', p_fund_type)
    );
  end if;

  insert into public.funds (user_id, name, opening_balance, fund_type)
  values (v_user, v_name, p_opening_balance, p_fund_type)
  returning * into v_fund;

  return v_fund;
end;
$$;

create or replace function public.rpc_update_fund(
  p_fund_id uuid,
  p_name text,
  p_fund_type text
)
returns public.funds
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_user uuid := public.require_user();
  v_fund public.funds%rowtype;
  v_name text := btrim(coalesce(p_name, ''));
begin
  select * into v_fund
  from public.funds
  where id = p_fund_id
    and user_id = v_user
  for update;

  if not found then
    perform public.raise_app_error(
      'FUND_NOT_FOUND',
      jsonb_build_object('fund_id', p_fund_id)
    );
  end if;

  if v_name = '' then
    perform public.raise_app_error(
      'VALIDATION_ERROR',
      jsonb_build_object('field', 'name')
    );
  end if;

  if p_fund_type is null or p_fund_type not in ('active', 'savings_goal') then
    perform public.raise_app_error(
      'INVALID_FUND_TYPE',
      jsonb_build_object('fund_type', p_fund_type)
    );
  end if;

  update public.funds
  set
    name = v_name,
    fund_type = p_fund_type
  where id = v_fund.id
  returning * into v_fund;

  return v_fund;
end;
$$;

create or replace function public.rpc_archive_fund(p_fund_id uuid)
returns public.funds
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_user uuid := public.require_user();
  v_fund public.funds%rowtype;
  v_balance numeric;
begin
  select * into v_fund
  from public.funds
  where id = p_fund_id
    and user_id = v_user
  for update;

  if not found then
    perform public.raise_app_error(
      'FUND_NOT_FOUND',
      jsonb_build_object('fund_id', p_fund_id)
    );
  end if;

  if v_fund.is_archived then
    return v_fund;
  end if;

  if exists (
    select 1
    from public.pocket_items pi
    where pi.fund_id = v_fund.id
      and pi.user_id = v_user
  ) then
    perform public.raise_app_error(
      'FUND_REFERENCED_BY_POCKET',
      jsonb_build_object('fund_id', v_fund.id)
    );
  end if;

  v_balance := public.fund_balance(v_fund.id);

  if v_balance <> 0 then
    perform public.raise_app_error(
      'FUND_BALANCE_NOT_ZERO',
      jsonb_build_object('fund_id', v_fund.id, 'balance', v_balance)
    );
  end if;

  update public.funds
  set is_archived = true
  where id = v_fund.id
  returning * into v_fund;

  return v_fund;
end;
$$;

create or replace function public.rpc_unarchive_fund(p_fund_id uuid)
returns public.funds
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_user uuid := public.require_user();
  v_fund public.funds%rowtype;
begin
  select * into v_fund
  from public.funds
  where id = p_fund_id
    and user_id = v_user
  for update;

  if not found then
    perform public.raise_app_error(
      'FUND_NOT_FOUND',
      jsonb_build_object('fund_id', p_fund_id)
    );
  end if;

  update public.funds
  set is_archived = false
  where id = v_fund.id
  returning * into v_fund;

  return v_fund;
end;
$$;

create or replace function public.rpc_delete_fund(p_fund_id uuid)
returns void
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_user uuid := public.require_user();
  v_fund public.funds%rowtype;
begin
  select * into v_fund
  from public.funds
  where id = p_fund_id
    and user_id = v_user
  for update;

  if not found then
    perform public.raise_app_error(
      'FUND_NOT_FOUND',
      jsonb_build_object('fund_id', p_fund_id)
    );
  end if;

  if exists (
    select 1
    from public.transactions t
    where t.user_id = v_user
      and (t.source_fund_id = v_fund.id or t.destination_fund_id = v_fund.id)
  ) then
    perform public.raise_app_error(
      'FUND_HAS_TRANSACTIONS',
      jsonb_build_object('fund_id', v_fund.id)
    );
  end if;

  if exists (
    select 1
    from public.pocket_items pi
    where pi.fund_id = v_fund.id
      and pi.user_id = v_user
  ) then
    perform public.raise_app_error(
      'FUND_REFERENCED_BY_POCKET',
      jsonb_build_object('fund_id', v_fund.id)
    );
  end if;

  delete from public.funds where id = v_fund.id;
end;
$$;

create or replace function public.rpc_get_fund_balances(
  p_include_archived boolean default false
)
returns table (
  id uuid,
  name text,
  fund_type text,
  is_archived boolean,
  opening_balance numeric,
  balance numeric
)
language plpgsql
stable
security invoker
set search_path = public, pg_temp
as $$
declare
  v_user uuid := public.require_user();
begin
  return query
  select
    v.id,
    v.name,
    v.fund_type,
    v.is_archived,
    v.opening_balance,
    v.balance
  from public.v_fund_balances v
  where v.user_id = v_user
    and (p_include_archived or not v.is_archived)
  order by v.is_archived, v.name;
end;
$$;

revoke all on function public.rpc_create_fund(text, numeric, text) from public, anon;
revoke all on function public.rpc_update_fund(uuid, text, text) from public, anon;
revoke all on function public.rpc_archive_fund(uuid) from public, anon;
revoke all on function public.rpc_unarchive_fund(uuid) from public, anon;
revoke all on function public.rpc_delete_fund(uuid) from public, anon;
revoke all on function public.rpc_get_fund_balances(boolean) from public, anon;

grant execute on function public.rpc_create_fund(text, numeric, text) to authenticated;
grant execute on function public.rpc_update_fund(uuid, text, text) to authenticated;
grant execute on function public.rpc_archive_fund(uuid) to authenticated;
grant execute on function public.rpc_unarchive_fund(uuid) to authenticated;
grant execute on function public.rpc_delete_fund(uuid) to authenticated;
grant execute on function public.rpc_get_fund_balances(boolean) to authenticated;
