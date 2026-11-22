-- 0010_rpc_pockets.sql
-- RPC Pocket, Pocket Item, dan transaksi yang dikelola Pocket.

create or replace function public.lock_pocket(p_pocket_id uuid)
returns public.pockets
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_user uuid := public.require_user();
  v_pocket public.pockets%rowtype;
begin
  select * into v_pocket
  from public.pockets
  where id = p_pocket_id
    and user_id = v_user
  for update;

  if not found then
    perform public.raise_app_error(
      'POCKET_NOT_FOUND',
      jsonb_build_object('pocket_id', p_pocket_id)
    );
  end if;

  return v_pocket;
end;
$$;

create or replace function public.lock_pocket_item(p_item_id uuid)
returns public.pocket_items
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_user uuid := public.require_user();
  v_item public.pocket_items%rowtype;
begin
  select * into v_item
  from public.pocket_items
  where id = p_item_id
    and user_id = v_user
  for update;

  if not found then
    perform public.raise_app_error(
      'POCKET_ITEM_NOT_FOUND',
      jsonb_build_object('item_id', p_item_id)
    );
  end if;

  return v_item;
end;
$$;

create or replace function public.rpc_create_pocket(
  p_name text,
  p_description text,
  p_type text
)
returns public.pockets
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_user uuid := public.require_user();
  v_name text := btrim(coalesce(p_name, ''));
  v_pocket public.pockets%rowtype;
begin
  if v_name = '' then
    perform public.raise_app_error(
      'VALIDATION_ERROR',
      jsonb_build_object('field', 'name')
    );
  end if;

  if p_type is null or p_type not in ('income', 'expense', 'transfer') then
    perform public.raise_app_error(
      'INVALID_POCKET_TYPE',
      jsonb_build_object('pocket_type', p_type)
    );
  end if;

  insert into public.pockets (user_id, name, description, type)
  values (v_user, v_name, nullif(btrim(coalesce(p_description, '')), ''), p_type)
  returning * into v_pocket;

  return v_pocket;
end;
$$;

create or replace function public.rpc_update_pocket(
  p_pocket_id uuid,
  p_name text,
  p_description text,
  p_type text
)
returns public.pockets
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_pocket public.pockets%rowtype;
  v_name text := btrim(coalesce(p_name, ''));
begin
  v_pocket := public.lock_pocket(p_pocket_id);

  if v_name = '' then
    perform public.raise_app_error(
      'VALIDATION_ERROR',
      jsonb_build_object('field', 'name')
    );
  end if;

  if p_type is null or p_type not in ('income', 'expense', 'transfer') then
    perform public.raise_app_error(
      'INVALID_POCKET_TYPE',
      jsonb_build_object('pocket_type', p_type)
    );
  end if;

  if p_type <> v_pocket.type and v_pocket.has_ever_had_item then
    perform public.raise_app_error(
      'POCKET_TYPE_IMMUTABLE',
      jsonb_build_object('pocket_id', v_pocket.id)
    );
  end if;

  update public.pockets
  set
    name = v_name,
    description = nullif(btrim(coalesce(p_description, '')), ''),
    type = p_type
  where id = v_pocket.id
  returning * into v_pocket;

  return v_pocket;
end;
$$;

create or replace function public.rpc_archive_pocket(p_pocket_id uuid)
returns public.pockets
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_pocket public.pockets%rowtype;
begin
  v_pocket := public.lock_pocket(p_pocket_id);

  update public.pockets
  set is_archived = true
  where id = v_pocket.id
  returning * into v_pocket;

  return v_pocket;
end;
$$;

create or replace function public.rpc_unarchive_pocket(p_pocket_id uuid)
returns public.pockets
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_pocket public.pockets%rowtype;
begin
  v_pocket := public.lock_pocket(p_pocket_id);

  update public.pockets
  set is_archived = false
  where id = v_pocket.id
  returning * into v_pocket;

  return v_pocket;
end;
$$;

create or replace function public.rpc_delete_pocket(p_pocket_id uuid)
returns void
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_user uuid := public.require_user();
  v_pocket public.pockets%rowtype;
  v_other_income uuid;
  v_other_expense uuid;
begin
  v_pocket := public.lock_pocket(p_pocket_id);

  perform 1
  from public.pocket_items
  where pocket_id = v_pocket.id
  order by id
  for update;

  perform 1
  from public.automations
  where pocket_item_id in (
    select id from public.pocket_items where pocket_id = v_pocket.id
  )
  order by id
  for update;

  select id into v_other_income
  from public.categories
  where type = 'income' and name = 'Other Income' and is_active
  limit 1;

  select id into v_other_expense
  from public.categories
  where type = 'expense' and name = 'Other' and is_active
  limit 1;

  -- Lepas transaksi aktual; dampak saldo tidak berubah.
  update public.transactions t
  set
    pocket_item_id = null,
    category_id = case
      when t.type = 'income' then v_other_income
      when t.type = 'expense' then v_other_expense
      else null
    end
  where t.user_id = v_user
    and t.pocket_item_id in (
      select id from public.pocket_items where pocket_id = v_pocket.id
    );

  delete from public.notifications n
  using public.automation_occurrences o
  where n.occurrence_id = o.id
    and o.user_id = v_user
    and o.pocket_item_id in (
      select id from public.pocket_items where pocket_id = v_pocket.id
    );

  delete from public.automation_occurrences
  where user_id = v_user
    and pocket_item_id in (
      select id from public.pocket_items where pocket_id = v_pocket.id
    );

  delete from public.automations
  where user_id = v_user
    and pocket_item_id in (
      select id from public.pocket_items where pocket_id = v_pocket.id
    );

  delete from public.pocket_items
  where user_id = v_user
    and pocket_id = v_pocket.id;

  delete from public.pockets
  where id = v_pocket.id;
end;
$$;

create or replace function public.rpc_create_income_item(
  p_pocket_id uuid,
  p_name text,
  p_amount numeric
)
returns public.pocket_items
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_user uuid := public.require_user();
  v_pocket public.pockets%rowtype;
  v_item public.pocket_items%rowtype;
  v_name text := btrim(coalesce(p_name, ''));
begin
  v_pocket := public.lock_pocket(p_pocket_id);

  if v_pocket.is_archived then
    perform public.raise_app_error(
      'POCKET_ARCHIVED',
      jsonb_build_object('pocket_id', v_pocket.id)
    );
  end if;

  if v_pocket.type <> 'income' then
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

  insert into public.pocket_items (
    user_id,
    pocket_id,
    name,
    amount,
    status
  )
  values (
    v_user,
    v_pocket.id,
    v_name,
    p_amount,
    'pending'
  )
  returning * into v_item;

  return v_item;
end;
$$;

create or replace function public.rpc_confirm_income_item(
  p_item_id uuid,
  p_destination_fund_id uuid
)
returns public.transactions
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_user uuid := public.require_user();
  v_item public.pocket_items%rowtype;
  v_pocket public.pockets%rowtype;
  v_fund public.funds%rowtype;
  v_tx public.transactions%rowtype;
begin
  perform public.lock_funds(array[p_destination_fund_id]);

  select * into v_fund
  from public.funds
  where id = p_destination_fund_id
    and user_id = v_user;

  if not found then
    perform public.raise_app_error(
      'FUND_NOT_FOUND',
      jsonb_build_object('fund_id', p_destination_fund_id)
    );
  end if;

  if v_fund.is_archived then
    perform public.raise_app_error(
      'FUND_ARCHIVED',
      jsonb_build_object('fund_id', v_fund.id)
    );
  end if;

  v_item := public.lock_pocket_item(p_item_id);

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

  if v_pocket.type <> 'income' then
    perform public.raise_app_error(
      'POCKET_TYPE_MISMATCH',
      jsonb_build_object('pocket_id', v_pocket.id, 'pocket_type', v_pocket.type)
    );
  end if;

  if v_item.status <> 'pending' then
    perform public.raise_app_error(
      'POCKET_ITEM_STATUS_INVALID',
      jsonb_build_object('item_id', v_item.id, 'status', v_item.status)
    );
  end if;

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
    v_item.amount,
    now(),
    v_fund.id,
    v_item.id
  )
  returning * into v_tx;

  update public.pocket_items
  set status = 'confirmed'
  where id = v_item.id;

  return v_tx;
end;
$$;

create or replace function public.rpc_create_planned_expense_item(
  p_pocket_id uuid,
  p_name text,
  p_amount numeric
)
returns public.pocket_items
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_user uuid := public.require_user();
  v_pocket public.pockets%rowtype;
  v_item public.pocket_items%rowtype;
  v_name text := btrim(coalesce(p_name, ''));
begin
  v_pocket := public.lock_pocket(p_pocket_id);

  if v_pocket.is_archived then
    perform public.raise_app_error(
      'POCKET_ARCHIVED',
      jsonb_build_object('pocket_id', v_pocket.id)
    );
  end if;

  if v_pocket.type <> 'expense' then
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

  insert into public.pocket_items (
    user_id,
    pocket_id,
    name,
    amount,
    status
  )
  values (
    v_user,
    v_pocket.id,
    v_name,
    p_amount,
    'planned'
  )
  returning * into v_item;

  return v_item;
end;
$$;

create or replace function public.rpc_update_planned_expense_item(
  p_item_id uuid,
  p_name text,
  p_amount numeric
)
returns public.pocket_items
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_item public.pocket_items%rowtype;
  v_pocket public.pockets%rowtype;
  v_name text := btrim(coalesce(p_name, ''));
begin
  v_item := public.lock_pocket_item(p_item_id);

  select * into v_pocket
  from public.pockets
  where id = v_item.pocket_id;

  if not found then
    perform public.raise_app_error(
      'POCKET_NOT_FOUND',
      jsonb_build_object('pocket_id', v_item.pocket_id)
    );
  end if;

  if v_pocket.type <> 'expense' then
    perform public.raise_app_error(
      'POCKET_TYPE_MISMATCH',
      jsonb_build_object('pocket_id', v_pocket.id, 'pocket_type', v_pocket.type)
    );
  end if;

  if v_item.status <> 'planned' then
    perform public.raise_app_error(
      'POCKET_ITEM_NOT_PLANNED',
      jsonb_build_object('item_id', v_item.id, 'status', v_item.status)
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

  update public.pocket_items
  set name = v_name, amount = p_amount
  where id = v_item.id
  returning * into v_item;

  return v_item;
end;
$$;

create or replace function public.rpc_convert_planned_expense(
  p_item_id uuid,
  p_source_fund_id uuid
)
returns public.transactions
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_user uuid := public.require_user();
  v_item public.pocket_items%rowtype;
  v_pocket public.pockets%rowtype;
  v_fund public.funds%rowtype;
  v_balance numeric;
  v_tx public.transactions%rowtype;
begin
  perform public.lock_funds(array[p_source_fund_id]);

  select * into v_fund
  from public.funds
  where id = p_source_fund_id
    and user_id = v_user;

  if not found then
    perform public.raise_app_error(
      'FUND_NOT_FOUND',
      jsonb_build_object('fund_id', p_source_fund_id)
    );
  end if;

  if v_fund.is_archived then
    perform public.raise_app_error(
      'FUND_ARCHIVED',
      jsonb_build_object('fund_id', v_fund.id)
    );
  end if;

  if v_fund.fund_type <> 'active' then
    perform public.raise_app_error(
      'SOURCE_FUND_NOT_ACTIVE',
      jsonb_build_object('fund_id', v_fund.id, 'fund_type', v_fund.fund_type)
    );
  end if;

  v_item := public.lock_pocket_item(p_item_id);

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

  if v_pocket.type <> 'expense' then
    perform public.raise_app_error(
      'POCKET_TYPE_MISMATCH',
      jsonb_build_object('pocket_id', v_pocket.id, 'pocket_type', v_pocket.type)
    );
  end if;

  if v_item.status <> 'planned' then
    perform public.raise_app_error(
      'POCKET_ITEM_NOT_PLANNED',
      jsonb_build_object('item_id', v_item.id, 'status', v_item.status)
    );
  end if;

  v_balance := public.fund_balance(v_fund.id);

  if v_balance < v_item.amount then
    perform public.raise_app_error(
      'INSUFFICIENT_BALANCE',
      jsonb_build_object(
        'fund_id', v_fund.id,
        'balance', v_balance,
        'amount', v_item.amount
      )
    );
  end if;

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
    v_item.amount,
    now(),
    v_fund.id,
    v_item.id
  )
  returning * into v_tx;

  update public.pocket_items
  set status = 'converted'
  where id = v_item.id;

  return v_tx;
end;
$$;

create or replace function public.rpc_create_transfer_item(
  p_pocket_id uuid,
  p_name text,
  p_amount numeric,
  p_source_fund_id uuid,
  p_destination_fund_id uuid,
  p_occurred_at timestamptz
)
returns public.pocket_items
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_user uuid := public.require_user();
  v_pocket public.pockets%rowtype;
  v_source public.funds%rowtype;
  v_destination public.funds%rowtype;
  v_item public.pocket_items%rowtype;
  v_balance numeric;
  v_name text := btrim(coalesce(p_name, ''));
begin
  v_pocket := public.lock_pocket(p_pocket_id);

  if v_pocket.is_archived then
    perform public.raise_app_error(
      'POCKET_ARCHIVED',
      jsonb_build_object('pocket_id', v_pocket.id)
    );
  end if;

  if v_pocket.type <> 'transfer' then
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

  if p_occurred_at is null then
    perform public.raise_app_error('INVALID_DATE');
  end if;

  if p_source_fund_id is null or p_destination_fund_id is null then
    perform public.raise_app_error(
      'VALIDATION_ERROR',
      jsonb_build_object('reason', 'transfer_funds_required')
    );
  end if;

  if p_source_fund_id = p_destination_fund_id then
    perform public.raise_app_error('SAME_FUND_TRANSFER');
  end if;

  perform public.lock_funds(array[p_source_fund_id, p_destination_fund_id]);

  select * into v_source
  from public.funds
  where id = p_source_fund_id
    and user_id = v_user;

  if not found then
    perform public.raise_app_error(
      'FUND_NOT_FOUND',
      jsonb_build_object('fund_id', p_source_fund_id)
    );
  end if;

  select * into v_destination
  from public.funds
  where id = p_destination_fund_id
    and user_id = v_user;

  if not found then
    perform public.raise_app_error(
      'FUND_NOT_FOUND',
      jsonb_build_object('fund_id', p_destination_fund_id)
    );
  end if;

  if v_source.is_archived then
    perform public.raise_app_error(
      'FUND_ARCHIVED',
      jsonb_build_object('fund_id', v_source.id)
    );
  end if;

  if v_destination.is_archived then
    perform public.raise_app_error(
      'FUND_ARCHIVED',
      jsonb_build_object('fund_id', v_destination.id)
    );
  end if;

  v_balance := public.fund_balance(v_source.id);

  if v_balance < p_amount then
    perform public.raise_app_error(
      'INSUFFICIENT_BALANCE',
      jsonb_build_object(
        'fund_id', v_source.id,
        'balance', v_balance,
        'amount', p_amount
      )
    );
  end if;

  insert into public.pocket_items (
    user_id,
    pocket_id,
    name,
    amount,
    status
  )
  values (
    v_user,
    v_pocket.id,
    v_name,
    p_amount,
    'completed'
  )
  returning * into v_item;

  insert into public.transactions (
    user_id,
    type,
    amount,
    occurred_at,
    source_fund_id,
    destination_fund_id,
    pocket_item_id
  )
  values (
    v_user,
    'transfer',
    p_amount,
    p_occurred_at,
    v_source.id,
    v_destination.id,
    v_item.id
  );

  return v_item;
end;
$$;

create or replace function public.rpc_delete_pocket_item(p_item_id uuid)
returns void
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_item public.pocket_items%rowtype;
begin
  v_item := public.lock_pocket_item(p_item_id);

  if v_item.status not in ('pending', 'planned') then
    perform public.raise_app_error(
      'POCKET_ITEM_STATUS_INVALID',
      jsonb_build_object('item_id', v_item.id, 'status', v_item.status)
    );
  end if;

  delete from public.pocket_items where id = v_item.id;
end;
$$;

create or replace function public.rpc_update_pocket_transaction(
  p_transaction_id uuid,
  p_amount numeric,
  p_occurred_at timestamptz,
  p_source_fund_id uuid,
  p_destination_fund_id uuid
)
returns public.transactions
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_user uuid := public.require_user();
  v_tx public.transactions%rowtype;
  v_item public.pocket_items%rowtype;
  v_pocket public.pockets%rowtype;
  v_fund public.funds%rowtype;
  v_fund_ids uuid[];
  v_fund_id uuid;
  v_balance numeric;
  v_old_effect numeric;
  v_new_effect numeric;
begin
  select * into v_tx
  from public.transactions
  where id = p_transaction_id
    and user_id = v_user
  for update;

  if not found then
    perform public.raise_app_error(
      'TRANSACTION_NOT_FOUND',
      jsonb_build_object('transaction_id', p_transaction_id)
    );
  end if;

  if v_tx.pocket_item_id is null then
    perform public.raise_app_error(
      'TRANSACTION_MANAGED_BY_POCKET',
      jsonb_build_object('transaction_id', v_tx.id)
    );
  end if;

  v_item := public.lock_pocket_item(v_tx.pocket_item_id);

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

  if p_amount is null or p_amount <= 0 then
    perform public.raise_app_error('INVALID_AMOUNT', jsonb_build_object('amount', p_amount));
  end if;

  if p_occurred_at is null then
    perform public.raise_app_error('INVALID_DATE');
  end if;

  if v_tx.type = 'expense'
    and v_item.status = 'converted'
    and p_amount <> v_tx.amount then
    perform public.raise_app_error(
      'AMOUNT_IMMUTABLE',
      jsonb_build_object('transaction_id', v_tx.id)
    );
  end if;

  if v_tx.type = 'income' then
    if p_source_fund_id is not null or p_destination_fund_id is null then
      perform public.raise_app_error(
        'VALIDATION_ERROR',
        jsonb_build_object('reason', 'income_shape')
      );
    end if;
  elsif v_tx.type = 'expense' then
    if p_source_fund_id is null or p_destination_fund_id is not null then
      perform public.raise_app_error(
        'VALIDATION_ERROR',
        jsonb_build_object('reason', 'expense_shape')
      );
    end if;
  else
    if p_source_fund_id is null or p_destination_fund_id is null then
      perform public.raise_app_error(
        'VALIDATION_ERROR',
        jsonb_build_object('reason', 'transfer_shape')
      );
    end if;

    if p_source_fund_id = p_destination_fund_id then
      perform public.raise_app_error('SAME_FUND_TRANSFER');
    end if;
  end if;

  v_fund_ids := array(
    select distinct x
    from unnest(array[
      v_tx.source_fund_id,
      v_tx.destination_fund_id,
      p_source_fund_id,
      p_destination_fund_id
    ]) as x
    where x is not null
  );

  perform public.lock_funds(v_fund_ids);

  foreach v_fund_id in array v_fund_ids loop
    select * into v_fund
    from public.funds
    where id = v_fund_id
      and user_id = v_user;

    if not found then
      perform public.raise_app_error(
        'FUND_NOT_FOUND',
        jsonb_build_object('fund_id', v_fund_id)
      );
    end if;

    if v_fund.is_archived and v_fund_id in (
      p_source_fund_id,
      p_destination_fund_id
    ) then
      perform public.raise_app_error(
        'FUND_ARCHIVED',
        jsonb_build_object('fund_id', v_fund.id)
      );
    end if;

    if v_tx.type = 'expense'
      and v_fund_id = p_source_fund_id
      and v_fund.fund_type <> 'active' then
      perform public.raise_app_error(
        'SOURCE_FUND_NOT_ACTIVE',
        jsonb_build_object('fund_id', v_fund.id, 'fund_type', v_fund.fund_type)
      );
    end if;

    v_balance := public.fund_balance(v_fund.id);
    v_old_effect := public.transaction_fund_effect(
      v_tx.type,
      v_tx.amount,
      v_tx.source_fund_id,
      v_tx.destination_fund_id,
      v_fund.id
    );
    v_new_effect := public.transaction_fund_effect(
      v_tx.type,
      p_amount,
      p_source_fund_id,
      p_destination_fund_id,
      v_fund.id
    );

    if v_balance - v_old_effect + v_new_effect < 0 then
      perform public.raise_app_error(
        'FUND_BALANCE_NEGATIVE',
        jsonb_build_object(
          'fund_id', v_fund.id,
          'balance_after', v_balance - v_old_effect + v_new_effect
        )
      );
    end if;
  end loop;

  update public.transactions
  set
    amount = p_amount,
    occurred_at = p_occurred_at,
    source_fund_id = p_source_fund_id,
    destination_fund_id = p_destination_fund_id
  where id = v_tx.id
  returning * into v_tx;

  if p_amount is distinct from v_item.amount
    and (
      (v_pocket.type = 'income' and v_item.status in ('pending', 'confirmed'))
      or v_pocket.type = 'transfer'
    ) then
    update public.pocket_items
    set amount = p_amount
    where id = v_item.id;
  end if;

  return v_tx;
end;
$$;

create or replace function public.rpc_delete_pocket_transaction(
  p_transaction_id uuid
)
returns void
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_user uuid := public.require_user();
  v_tx public.transactions%rowtype;
  v_item public.pocket_items%rowtype;
  v_pocket public.pockets%rowtype;
  v_fund_ids uuid[];
  v_fund_id uuid;
  v_balance numeric;
  v_effect numeric;
begin
  select * into v_tx
  from public.transactions
  where id = p_transaction_id
    and user_id = v_user
  for update;

  if not found then
    perform public.raise_app_error(
      'TRANSACTION_NOT_FOUND',
      jsonb_build_object('transaction_id', p_transaction_id)
    );
  end if;

  if v_tx.pocket_item_id is null then
    perform public.raise_app_error(
      'TRANSACTION_MANAGED_BY_POCKET',
      jsonb_build_object('transaction_id', v_tx.id)
    );
  end if;

  v_item := public.lock_pocket_item(v_tx.pocket_item_id);

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

  if v_pocket.type = 'income' and v_item.status = 'template' then
    perform public.raise_app_error(
      'TRANSACTION_PROTECTED',
      jsonb_build_object('transaction_id', v_tx.id, 'reason', 'income_automation')
    );
  end if;

  if exists (
    select 1
    from public.automation_occurrences o
    where o.transaction_id = v_tx.id
      and o.status = 'confirmed'
      and v_pocket.type = 'income'
  ) then
    perform public.raise_app_error(
      'TRANSACTION_PROTECTED',
      jsonb_build_object('transaction_id', v_tx.id, 'reason', 'income_automation')
    );
  end if;

  v_fund_ids := array(
    select distinct x
    from unnest(array[
      v_tx.source_fund_id,
      v_tx.destination_fund_id
    ]) as x
    where x is not null
  );

  perform public.lock_funds(v_fund_ids);

  foreach v_fund_id in array v_fund_ids loop
    v_balance := public.fund_balance(v_fund_id);
    v_effect := public.transaction_fund_effect(
      v_tx.type,
      v_tx.amount,
      v_tx.source_fund_id,
      v_tx.destination_fund_id,
      v_fund_id
    );

    if v_balance - v_effect < 0 then
      perform public.raise_app_error(
        'FUND_BALANCE_NEGATIVE',
        jsonb_build_object(
          'fund_id', v_fund_id,
          'balance_after', v_balance - v_effect
        )
      );
    end if;
  end loop;

  delete from public.transactions where id = v_tx.id;

  if v_pocket.type = 'income' then
    if v_item.status = 'confirmed' then
      update public.pocket_items
      set status = 'pending'
      where id = v_item.id;
    end if;
  elsif v_pocket.type = 'expense' then
    if v_item.status = 'converted' then
      update public.pocket_items
      set status = 'planned'
      where id = v_item.id;
    end if;
  elsif v_pocket.type = 'transfer' then
    delete from public.pocket_items where id = v_item.id;
  end if;
end;
$$;

revoke all on function public.lock_pocket(uuid) from public, anon;
revoke all on function public.lock_pocket_item(uuid) from public, anon;
revoke all on function public.rpc_create_pocket(text, text, text) from public, anon;
revoke all on function public.rpc_update_pocket(uuid, text, text, text) from public, anon;
revoke all on function public.rpc_archive_pocket(uuid) from public, anon;
revoke all on function public.rpc_unarchive_pocket(uuid) from public, anon;
revoke all on function public.rpc_delete_pocket(uuid) from public, anon;
revoke all on function public.rpc_create_income_item(uuid, text, numeric) from public, anon;
revoke all on function public.rpc_confirm_income_item(uuid, uuid) from public, anon;
revoke all on function public.rpc_create_planned_expense_item(uuid, text, numeric) from public, anon;
revoke all on function public.rpc_update_planned_expense_item(uuid, text, numeric) from public, anon;
revoke all on function public.rpc_convert_planned_expense(uuid, uuid) from public, anon;
revoke all on function public.rpc_create_transfer_item(uuid, text, numeric, uuid, uuid, timestamptz) from public, anon;
revoke all on function public.rpc_delete_pocket_item(uuid) from public, anon;
revoke all on function public.rpc_update_pocket_transaction(uuid, numeric, timestamptz, uuid, uuid) from public, anon;
revoke all on function public.rpc_delete_pocket_transaction(uuid) from public, anon;

grant execute on function public.lock_pocket(uuid) to authenticated;
grant execute on function public.lock_pocket_item(uuid) to authenticated;
grant execute on function public.rpc_create_pocket(text, text, text) to authenticated;
grant execute on function public.rpc_update_pocket(uuid, text, text, text) to authenticated;
grant execute on function public.rpc_archive_pocket(uuid) to authenticated;
grant execute on function public.rpc_unarchive_pocket(uuid) to authenticated;
grant execute on function public.rpc_delete_pocket(uuid) to authenticated;
grant execute on function public.rpc_create_income_item(uuid, text, numeric) to authenticated;
grant execute on function public.rpc_confirm_income_item(uuid, uuid) to authenticated;
grant execute on function public.rpc_create_planned_expense_item(uuid, text, numeric) to authenticated;
grant execute on function public.rpc_update_planned_expense_item(uuid, text, numeric) to authenticated;
grant execute on function public.rpc_convert_planned_expense(uuid, uuid) to authenticated;
grant execute on function public.rpc_create_transfer_item(uuid, text, numeric, uuid, uuid, timestamptz) to authenticated;
grant execute on function public.rpc_delete_pocket_item(uuid) to authenticated;
grant execute on function public.rpc_update_pocket_transaction(uuid, numeric, timestamptz, uuid, uuid) to authenticated;
grant execute on function public.rpc_delete_pocket_transaction(uuid) to authenticated;
