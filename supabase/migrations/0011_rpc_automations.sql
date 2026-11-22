-- 0011_rpc_automations.sql
-- RPC Automation, occurrence, dan Notification.

create or replace function public.automation_local_midnight(
  p_date date,
  p_timezone text
)
returns timestamptz
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select (p_date::timestamp at time zone p_timezone);
$$;

create or replace function public.automation_next_schedule(
  p_current timestamptz,
  p_frequency text,
  p_timezone text,
  p_start_date date
)
returns timestamptz
language plpgsql
stable
security invoker
set search_path = public, pg_temp
as $$
declare
  v_local timestamp := p_current at time zone p_timezone;
  v_next_date date;
  v_month_start date;
  v_last_day integer;
  v_day integer;
begin
  if p_frequency = 'weekly' then
    v_next_date := v_local::date + 7;
  elsif p_frequency = 'every_two_weeks' then
    v_next_date := v_local::date + 14;
  elsif p_frequency = 'monthly' then
    v_month_start := (date_trunc('month', v_local) + interval '1 month')::date;
    v_last_day := extract(
      day from (v_month_start + interval '1 month - 1 day')
    )::integer;
    v_day := least(extract(day from p_start_date)::integer, v_last_day);
    v_next_date := v_month_start + (v_day - 1);
  else
    perform public.raise_app_error(
      'INVALID_FREQUENCY',
      jsonb_build_object('frequency', p_frequency)
    );
  end if;

  return (v_next_date::timestamp at time zone p_timezone);
end;
$$;

create or replace function public.rpc_create_automation(
  p_pocket_id uuid,
  p_name text,
  p_amount numeric,
  p_fund_id uuid,
  p_frequency text,
  p_start_date date,
  p_timezone text
)
returns public.automations
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_user uuid := public.require_user();
  v_pocket public.pockets%rowtype;
  v_item public.pocket_items%rowtype;
  v_fund public.funds%rowtype;
  v_automation public.automations%rowtype;
  v_name text := btrim(coalesce(p_name, ''));
begin
  v_pocket := public.lock_pocket(p_pocket_id);

  if v_pocket.is_archived then
    perform public.raise_app_error(
      'POCKET_ARCHIVED',
      jsonb_build_object('pocket_id', v_pocket.id)
    );
  end if;

  if v_pocket.type = 'transfer' then
    perform public.raise_app_error(
      'AUTOMATION_TYPE_UNSUPPORTED',
      jsonb_build_object('pocket_id', v_pocket.id, 'pocket_type', v_pocket.type)
    );
  end if;

  if v_pocket.type not in ('income', 'expense') then
    perform public.raise_app_error(
      'POCKET_TYPE_MISMATCH',
      jsonb_build_object('pocket_id', v_pocket.id, 'pocket_type', v_pocket.type)
    );
  end if;

  if v_name = '' then
    perform public.raise_app_error(
      'VALIDATION_ERROR',
      jsonb_build_object('field', 'name')
    );
  end if;

  if p_amount is null or p_amount <= 0 then
    perform public.raise_app_error(
      'INVALID_AMOUNT',
      jsonb_build_object('amount', p_amount)
    );
  end if;

  if p_frequency is null or p_frequency not in ('weekly', 'every_two_weeks', 'monthly') then
    perform public.raise_app_error(
      'INVALID_FREQUENCY',
      jsonb_build_object('frequency', p_frequency)
    );
  end if;

  if p_start_date is null then
    perform public.raise_app_error('INVALID_DATE');
  end if;

  if p_timezone is null or not public.is_valid_timezone(p_timezone) then
    perform public.raise_app_error(
      'VALIDATION_ERROR',
      jsonb_build_object('reason', 'invalid_timezone', 'timezone', p_timezone)
    );
  end if;

  perform public.lock_funds(array[p_fund_id]);

  select * into v_fund
  from public.funds
  where id = p_fund_id
    and user_id = v_user;

  if not found then
    perform public.raise_app_error(
      'FUND_NOT_FOUND',
      jsonb_build_object('fund_id', p_fund_id)
    );
  end if;

  if v_fund.is_archived then
    perform public.raise_app_error(
      'FUND_ARCHIVED',
      jsonb_build_object('fund_id', v_fund.id)
    );
  end if;

  if v_pocket.type = 'expense' and v_fund.fund_type <> 'active' then
    perform public.raise_app_error(
      'SOURCE_FUND_NOT_ACTIVE',
      jsonb_build_object('fund_id', v_fund.id, 'fund_type', v_fund.fund_type)
    );
  end if;

  insert into public.pocket_items (
    user_id,
    pocket_id,
    name,
    amount,
    fund_id,
    status
  )
  values (
    v_user,
    v_pocket.id,
    v_name,
    p_amount,
    v_fund.id,
    'template'
  )
  returning * into v_item;

  insert into public.automations (
    user_id,
    pocket_item_id,
    frequency,
    start_date,
    next_run_at,
    timezone,
    is_active
  )
  values (
    v_user,
    v_item.id,
    p_frequency,
    p_start_date,
    public.automation_local_midnight(p_start_date, p_timezone),
    p_timezone,
    true
  )
  returning * into v_automation;

  return v_automation;
end;
$$;

create or replace function public.rpc_update_automation(
  p_automation_id uuid,
  p_name text,
  p_amount numeric,
  p_fund_id uuid,
  p_frequency text,
  p_start_date date,
  p_timezone text
)
returns public.automations
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_user uuid := public.require_user();
  v_automation public.automations%rowtype;
  v_item public.pocket_items%rowtype;
  v_pocket public.pockets%rowtype;
  v_fund public.funds%rowtype;
  v_name text := btrim(coalesce(p_name, ''));
begin
  select * into v_automation
  from public.automations
  where id = p_automation_id
    and user_id = v_user
  for update;

  if not found then
    perform public.raise_app_error(
      'AUTOMATION_NOT_FOUND',
      jsonb_build_object('automation_id', p_automation_id)
    );
  end if;

  v_item := public.lock_pocket_item(v_automation.pocket_item_id);

  select * into v_pocket
  from public.pockets
  where id = v_item.pocket_id
    and user_id = v_user;

  if not found then
    perform public.raise_app_error(
      'POCKET_NOT_FOUND',
      jsonb_build_object('pocket_id', v_item.pocket_id)
    );
  end if;

  if v_pocket.type not in ('income', 'expense') then
    perform public.raise_app_error(
      'AUTOMATION_TYPE_UNSUPPORTED',
      jsonb_build_object('pocket_id', v_pocket.id, 'pocket_type', v_pocket.type)
    );
  end if;

  if v_name = '' then
    perform public.raise_app_error(
      'VALIDATION_ERROR',
      jsonb_build_object('field', 'name')
    );
  end if;

  if p_amount is null or p_amount <= 0 then
    perform public.raise_app_error(
      'INVALID_AMOUNT',
      jsonb_build_object('amount', p_amount)
    );
  end if;

  if p_frequency is null or p_frequency not in ('weekly', 'every_two_weeks', 'monthly') then
    perform public.raise_app_error(
      'INVALID_FREQUENCY',
      jsonb_build_object('frequency', p_frequency)
    );
  end if;

  if p_start_date is null then
    perform public.raise_app_error('INVALID_DATE');
  end if;

  if p_timezone is null or not public.is_valid_timezone(p_timezone) then
    perform public.raise_app_error(
      'VALIDATION_ERROR',
      jsonb_build_object('reason', 'invalid_timezone', 'timezone', p_timezone)
    );
  end if;

  perform public.lock_funds(array[p_fund_id]);

  select * into v_fund
  from public.funds
  where id = p_fund_id
    and user_id = v_user;

  if not found then
    perform public.raise_app_error(
      'FUND_NOT_FOUND',
      jsonb_build_object('fund_id', p_fund_id)
    );
  end if;

  if v_fund.is_archived then
    perform public.raise_app_error(
      'FUND_ARCHIVED',
      jsonb_build_object('fund_id', v_fund.id)
    );
  end if;

  if v_pocket.type = 'expense' and v_fund.fund_type <> 'active' then
    perform public.raise_app_error(
      'SOURCE_FUND_NOT_ACTIVE',
      jsonb_build_object('fund_id', v_fund.id, 'fund_type', v_fund.fund_type)
    );
  end if;

  update public.pocket_items
  set
    name = v_name,
    amount = p_amount,
    fund_id = v_fund.id
  where id = v_item.id
  returning * into v_item;

  update public.automations
  set
    frequency = p_frequency,
    start_date = p_start_date,
    timezone = p_timezone,
    next_run_at = public.automation_local_midnight(p_start_date, p_timezone)
  where id = v_automation.id
  returning * into v_automation;

  delete from public.notifications
  where occurrence_id in (
    select id
    from public.automation_occurrences
    where automation_id = v_automation.id
      and status = 'pending'
  );

  delete from public.automation_occurrences
  where automation_id = v_automation.id
    and status = 'pending';

  return v_automation;
end;
$$;

create or replace function public.rpc_delete_automation(p_automation_id uuid)
returns void
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_user uuid := public.require_user();
  v_automation public.automations%rowtype;
  v_item public.pocket_items%rowtype;
  v_other_income uuid;
  v_other_expense uuid;
begin
  select * into v_automation
  from public.automations
  where id = p_automation_id
    and user_id = v_user
  for update;

  if not found then
    perform public.raise_app_error(
      'AUTOMATION_NOT_FOUND',
      jsonb_build_object('automation_id', p_automation_id)
    );
  end if;

  v_item := public.lock_pocket_item(v_automation.pocket_item_id);

  select id into v_other_income
  from public.categories
  where type = 'income' and name = 'Other Income' and is_active
  limit 1;

  select id into v_other_expense
  from public.categories
  where type = 'expense' and name = 'Other' and is_active
  limit 1;

  update public.transactions t
  set
    pocket_item_id = null,
    category_id = case
      when t.type = 'income' then v_other_income
      when t.type = 'expense' then v_other_expense
      else null
    end
  where t.user_id = v_user
    and t.pocket_item_id = v_item.id;

  delete from public.notifications
  where occurrence_id in (
    select id
    from public.automation_occurrences
    where pocket_item_id = v_item.id
  );

  delete from public.automation_occurrences
  where pocket_item_id = v_item.id;

  delete from public.automations
  where id = v_automation.id;

  delete from public.pocket_items
  where id = v_item.id;
end;
$$;

create or replace function public.rpc_confirm_occurrence(
  p_occurrence_id uuid,
  p_fund_id uuid,
  p_amount numeric default null
)
returns public.transactions
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_user uuid := public.require_user();
  v_occurrence public.automation_occurrences%rowtype;
  v_item public.pocket_items%rowtype;
  v_pocket public.pockets%rowtype;
  v_fund public.funds%rowtype;
  v_tx public.transactions%rowtype;
  v_amount numeric;
  v_balance numeric;
begin
  select * into v_occurrence
  from public.automation_occurrences
  where id = p_occurrence_id
    and user_id = v_user;

  if not found then
    perform public.raise_app_error(
      'OCCURRENCE_NOT_FOUND',
      jsonb_build_object('occurrence_id', p_occurrence_id)
    );
  end if;

  select * into v_item
  from public.pocket_items
  where id = v_occurrence.pocket_item_id
    and user_id = v_user;

  if not found then
    perform public.raise_app_error(
      'POCKET_ITEM_NOT_FOUND',
      jsonb_build_object('item_id', v_occurrence.pocket_item_id)
    );
  end if;

  select * into v_pocket
  from public.pockets
  where id = v_item.pocket_id
    and user_id = v_user;

  if not found then
    perform public.raise_app_error(
      'POCKET_NOT_FOUND',
      jsonb_build_object('pocket_id', v_item.pocket_id)
    );
  end if;

  if v_pocket.type = 'income' then
    if p_amount is not null and p_amount <> v_item.amount then
      perform public.raise_app_error(
        'AMOUNT_NOT_ALLOWED',
        jsonb_build_object(
          'occurrence_id', v_occurrence.id,
          'template_amount', v_item.amount,
          'amount', p_amount
        )
      );
    end if;

    v_amount := v_item.amount;
  elsif v_pocket.type = 'expense' then
    v_amount := coalesce(p_amount, v_item.amount);

    if v_amount is null or v_amount <= 0 then
      perform public.raise_app_error(
        'INVALID_AMOUNT',
        jsonb_build_object('amount', p_amount)
      );
    end if;
  else
    perform public.raise_app_error(
      'AUTOMATION_TYPE_UNSUPPORTED',
      jsonb_build_object('pocket_id', v_pocket.id, 'pocket_type', v_pocket.type)
    );
  end if;

  perform public.lock_funds(array[p_fund_id]);

  select * into v_fund
  from public.funds
  where id = p_fund_id
    and user_id = v_user;

  if not found then
    perform public.raise_app_error(
      'FUND_NOT_FOUND',
      jsonb_build_object('fund_id', p_fund_id)
    );
  end if;

  if v_fund.is_archived then
    perform public.raise_app_error(
      'FUND_ARCHIVED',
      jsonb_build_object('fund_id', v_fund.id)
    );
  end if;

  if v_pocket.type = 'expense' and v_fund.fund_type <> 'active' then
    perform public.raise_app_error(
      'SOURCE_FUND_NOT_ACTIVE',
      jsonb_build_object('fund_id', v_fund.id, 'fund_type', v_fund.fund_type)
    );
  end if;

  if v_pocket.type = 'expense' then
    v_balance := public.fund_balance(v_fund.id);

    if v_balance < v_amount then
      perform public.raise_app_error(
        'INSUFFICIENT_BALANCE',
        jsonb_build_object(
          'fund_id', v_fund.id,
          'balance', v_balance,
          'amount', v_amount
        )
      );
    end if;
  end if;

  select * into v_occurrence
  from public.automation_occurrences
  where id = p_occurrence_id
    and user_id = v_user
  for update;

  if not found then
    perform public.raise_app_error(
      'OCCURRENCE_NOT_FOUND',
      jsonb_build_object('occurrence_id', p_occurrence_id)
    );
  end if;

  if v_occurrence.status <> 'pending' then
    perform public.raise_app_error(
      'OCCURRENCE_ALREADY_PROCESSED',
      jsonb_build_object('occurrence_id', v_occurrence.id, 'status', v_occurrence.status)
    );
  end if;

  if v_pocket.type = 'income' then
    insert into public.transactions (
      user_id,
      type,
      amount,
      occurred_at,
      destination_fund_id,
      pocket_item_id
    )
    values (
      v_user,
      'income',
      v_amount,
      v_occurrence.scheduled_for,
      v_fund.id,
      v_item.id
    )
    returning * into v_tx;
  else
    insert into public.transactions (
      user_id,
      type,
      amount,
      occurred_at,
      source_fund_id,
      pocket_item_id
    )
    values (
      v_user,
      'expense',
      v_amount,
      v_occurrence.scheduled_for,
      v_fund.id,
      v_item.id
    )
    returning * into v_tx;
  end if;

  update public.automation_occurrences
  set
    status = 'confirmed',
    confirmed_amount = v_amount,
    transaction_id = v_tx.id,
    processed_at = now()
  where id = v_occurrence.id;

  delete from public.notifications
  where occurrence_id = v_occurrence.id;

  return v_tx;
end;
$$;

create or replace function public.rpc_reject_occurrence(
  p_occurrence_id uuid
)
returns void
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_user uuid := public.require_user();
  v_occurrence public.automation_occurrences%rowtype;
begin
  select * into v_occurrence
  from public.automation_occurrences
  where id = p_occurrence_id
    and user_id = v_user
  for update;

  if not found then
    perform public.raise_app_error(
      'OCCURRENCE_NOT_FOUND',
      jsonb_build_object('occurrence_id', p_occurrence_id)
    );
  end if;

  if v_occurrence.status <> 'pending' then
    perform public.raise_app_error(
      'OCCURRENCE_ALREADY_PROCESSED',
      jsonb_build_object('occurrence_id', v_occurrence.id, 'status', v_occurrence.status)
    );
  end if;

  update public.automation_occurrences
  set
    status = 'rejected',
    processed_at = now()
  where id = v_occurrence.id;

  delete from public.notifications
  where occurrence_id = v_occurrence.id;
end;
$$;

create or replace function public.rpc_get_pending_notifications()
returns setof public.v_pending_notifications
language plpgsql
stable
security invoker
set search_path = public, pg_temp
as $$
declare
  v_user uuid := public.require_user();
begin
  return query
  select n.*
  from public.v_pending_notifications n
  order by n.scheduled_for asc;
end;
$$;

revoke all on function public.automation_local_midnight(date, text) from public, anon;
revoke all on function public.automation_next_schedule(timestamptz, text, text, date) from public, anon;
revoke all on function public.rpc_create_automation(uuid, text, numeric, uuid, text, date, text) from public, anon;
revoke all on function public.rpc_update_automation(uuid, text, numeric, uuid, text, date, text) from public, anon;
revoke all on function public.rpc_delete_automation(uuid) from public, anon;
revoke all on function public.rpc_confirm_occurrence(uuid, uuid, numeric) from public, anon;
revoke all on function public.rpc_reject_occurrence(uuid) from public, anon;
revoke all on function public.rpc_get_pending_notifications() from public, anon;

grant execute on function public.automation_local_midnight(date, text) to authenticated;
grant execute on function public.automation_next_schedule(timestamptz, text, text, date) to authenticated;
grant execute on function public.rpc_create_automation(uuid, text, numeric, uuid, text, date, text) to authenticated;
grant execute on function public.rpc_update_automation(uuid, text, numeric, uuid, text, date, text) to authenticated;
grant execute on function public.rpc_delete_automation(uuid) to authenticated;
grant execute on function public.rpc_confirm_occurrence(uuid, uuid, numeric) to authenticated;
grant execute on function public.rpc_reject_occurrence(uuid) to authenticated;
grant execute on function public.rpc_get_pending_notifications() to authenticated;
