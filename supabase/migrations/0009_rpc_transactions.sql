-- 0009_rpc_transactions.sql
-- RPC transaksi standalone (Income, Expense, Transfer).

create or replace function public.transaction_fund_effect(
  p_type text,
  p_amount numeric,
  p_source_fund_id uuid,
  p_destination_fund_id uuid,
  p_fund_id uuid
)
returns numeric
language sql
immutable
security invoker
set search_path = public, pg_temp
as $$
  select case
    when p_fund_id is null then 0
    when p_type = 'income' and p_fund_id = p_destination_fund_id then p_amount
    when p_type = 'expense' and p_fund_id = p_source_fund_id then -p_amount
    when p_type = 'transfer' and p_fund_id = p_source_fund_id then -p_amount
    when p_type = 'transfer' and p_fund_id = p_destination_fund_id then p_amount
    else 0
  end;
$$;

create or replace function public.lock_funds(p_fund_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_user uuid := public.require_user();
  v_missing uuid;
begin
  if p_fund_ids is null or cardinality(p_fund_ids) = 0 then
    return;
  end if;

  perform 1
  from public.funds f
  where f.id = any(p_fund_ids)
    and f.user_id = v_user
  order by f.id
  for update;

  select x into v_missing
  from unnest(p_fund_ids) as x
  where not exists (
    select 1
    from public.funds f
    where f.id = x
      and f.user_id = v_user
  )
  limit 1;

  if v_missing is not null then
    perform public.raise_app_error(
      'FUND_NOT_FOUND',
      jsonb_build_object('fund_id', v_missing)
    );
  end if;
end;
$$;

create or replace function public.rpc_create_income(
  p_amount numeric,
  p_occurred_at timestamptz,
  p_destination_fund_id uuid,
  p_category_id uuid
)
returns public.transactions
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_user uuid := public.require_user();
  v_fund public.funds%rowtype;
  v_category public.categories%rowtype;
  v_tx public.transactions%rowtype;
begin
  if p_amount is null or p_amount <= 0 then
    perform public.raise_app_error('INVALID_AMOUNT', jsonb_build_object('amount', p_amount));
  end if;

  if p_occurred_at is null then
    perform public.raise_app_error('INVALID_DATE');
  end if;

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

  if p_category_id is null then
    perform public.raise_app_error('CATEGORY_REQUIRED');
  end if;

  select * into v_category
  from public.categories
  where id = p_category_id;

  if not found or not v_category.is_active then
    perform public.raise_app_error(
      'CATEGORY_NOT_FOUND',
      jsonb_build_object('category_id', p_category_id)
    );
  end if;

  if v_category.type <> 'income' then
    perform public.raise_app_error(
      'CATEGORY_TYPE_MISMATCH',
      jsonb_build_object(
        'category_id', v_category.id,
        'category_type', v_category.type,
        'transaction_type', 'income'
      )
    );
  end if;

  insert into public.transactions (
    user_id,
    type,
    amount,
    occurred_at,
    destination_fund_id,
    category_id
  )
  values (
    v_user,
    'income',
    p_amount,
    p_occurred_at,
    v_fund.id,
    v_category.id
  )
  returning * into v_tx;

  return v_tx;
end;
$$;

create or replace function public.rpc_create_expense(
  p_amount numeric,
  p_occurred_at timestamptz,
  p_source_fund_id uuid,
  p_category_id uuid
)
returns public.transactions
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_user uuid := public.require_user();
  v_fund public.funds%rowtype;
  v_category public.categories%rowtype;
  v_balance numeric;
  v_tx public.transactions%rowtype;
begin
  if p_amount is null or p_amount <= 0 then
    perform public.raise_app_error('INVALID_AMOUNT', jsonb_build_object('amount', p_amount));
  end if;

  if p_occurred_at is null then
    perform public.raise_app_error('INVALID_DATE');
  end if;

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

  v_balance := public.fund_balance(v_fund.id);

  if v_balance < p_amount then
    perform public.raise_app_error(
      'INSUFFICIENT_BALANCE',
      jsonb_build_object(
        'fund_id', v_fund.id,
        'balance', v_balance,
        'amount', p_amount
      )
    );
  end if;

  if p_category_id is null then
    perform public.raise_app_error('CATEGORY_REQUIRED');
  end if;

  select * into v_category
  from public.categories
  where id = p_category_id;

  if not found or not v_category.is_active then
    perform public.raise_app_error(
      'CATEGORY_NOT_FOUND',
      jsonb_build_object('category_id', p_category_id)
    );
  end if;

  if v_category.type <> 'expense' then
    perform public.raise_app_error(
      'CATEGORY_TYPE_MISMATCH',
      jsonb_build_object(
        'category_id', v_category.id,
        'category_type', v_category.type,
        'transaction_type', 'expense'
      )
    );
  end if;

  insert into public.transactions (
    user_id,
    type,
    amount,
    occurred_at,
    source_fund_id,
    category_id
  )
  values (
    v_user,
    'expense',
    p_amount,
    p_occurred_at,
    v_fund.id,
    v_category.id
  )
  returning * into v_tx;

  return v_tx;
end;
$$;

create or replace function public.rpc_create_transfer(
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
  v_source public.funds%rowtype;
  v_destination public.funds%rowtype;
  v_balance numeric;
  v_tx public.transactions%rowtype;
begin
  if p_amount is null or p_amount <= 0 then
    perform public.raise_app_error('INVALID_AMOUNT', jsonb_build_object('amount', p_amount));
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

  insert into public.transactions (
    user_id,
    type,
    amount,
    occurred_at,
    source_fund_id,
    destination_fund_id
  )
  values (
    v_user,
    'transfer',
    p_amount,
    p_occurred_at,
    v_source.id,
    v_destination.id
  )
  returning * into v_tx;

  return v_tx;
end;
$$;

create or replace function public.rpc_update_standalone_transaction(
  p_transaction_id uuid,
  p_amount numeric,
  p_occurred_at timestamptz,
  p_source_fund_id uuid,
  p_destination_fund_id uuid,
  p_category_id uuid
)
returns public.transactions
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_user uuid := public.require_user();
  v_tx public.transactions%rowtype;
  v_category public.categories%rowtype;
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

  if v_tx.pocket_item_id is not null then
    perform public.raise_app_error(
      'TRANSACTION_MANAGED_BY_POCKET',
      jsonb_build_object('transaction_id', v_tx.id)
    );
  end if;

  if p_amount is null or p_amount <= 0 then
    perform public.raise_app_error('INVALID_AMOUNT', jsonb_build_object('amount', p_amount));
  end if;

  if p_occurred_at is null then
    perform public.raise_app_error('INVALID_DATE');
  end if;

  if v_tx.type = 'income' then
    if p_source_fund_id is not null or p_destination_fund_id is null then
      perform public.raise_app_error(
        'VALIDATION_ERROR',
        jsonb_build_object('reason', 'income_shape')
      );
    end if;

    if p_category_id is null then
      perform public.raise_app_error('CATEGORY_REQUIRED');
    end if;
  elsif v_tx.type = 'expense' then
    if p_source_fund_id is null or p_destination_fund_id is not null then
      perform public.raise_app_error(
        'VALIDATION_ERROR',
        jsonb_build_object('reason', 'expense_shape')
      );
    end if;

    if p_category_id is null then
      perform public.raise_app_error('CATEGORY_REQUIRED');
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

    if p_category_id is not null then
      perform public.raise_app_error(
        'CATEGORY_FORBIDDEN',
        jsonb_build_object('reason', 'transfer_with_category')
      );
    end if;
  end if;

  if p_category_id is not null then
    select * into v_category
    from public.categories
    where id = p_category_id;

    if not found or not v_category.is_active then
      perform public.raise_app_error(
        'CATEGORY_NOT_FOUND',
        jsonb_build_object('category_id', p_category_id)
      );
    end if;

    if v_category.type <> v_tx.type then
      perform public.raise_app_error(
        'CATEGORY_TYPE_MISMATCH',
        jsonb_build_object(
          'category_id', v_category.id,
          'category_type', v_category.type,
          'transaction_type', v_tx.type
        )
      );
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
    destination_fund_id = p_destination_fund_id,
    category_id = p_category_id
  where id = v_tx.id
  returning * into v_tx;

  return v_tx;
end;
$$;

create or replace function public.rpc_delete_standalone_transaction(
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

  if v_tx.pocket_item_id is not null then
    perform public.raise_app_error(
      'TRANSACTION_MANAGED_BY_POCKET',
      jsonb_build_object('transaction_id', v_tx.id)
    );
  end if;

  if exists (
    select 1
    from public.automation_occurrences o
    join public.pocket_items pi on pi.id = o.pocket_item_id
    join public.pockets p on p.id = pi.pocket_id
    where o.transaction_id = v_tx.id
      and o.status = 'confirmed'
      and p.type = 'income'
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
end;
$$;

revoke all on function public.transaction_fund_effect(text, numeric, uuid, uuid, uuid) from public, anon;
revoke all on function public.lock_funds(uuid[]) from public, anon;
revoke all on function public.rpc_create_income(numeric, timestamptz, uuid, uuid) from public, anon;
revoke all on function public.rpc_create_expense(numeric, timestamptz, uuid, uuid) from public, anon;
revoke all on function public.rpc_create_transfer(numeric, timestamptz, uuid, uuid) from public, anon;
revoke all on function public.rpc_update_standalone_transaction(uuid, numeric, timestamptz, uuid, uuid, uuid) from public, anon;
revoke all on function public.rpc_delete_standalone_transaction(uuid) from public, anon;

grant execute on function public.transaction_fund_effect(text, numeric, uuid, uuid, uuid) to authenticated;
grant execute on function public.lock_funds(uuid[]) to authenticated;
grant execute on function public.rpc_create_income(numeric, timestamptz, uuid, uuid) to authenticated;
grant execute on function public.rpc_create_expense(numeric, timestamptz, uuid, uuid) to authenticated;
grant execute on function public.rpc_create_transfer(numeric, timestamptz, uuid, uuid) to authenticated;
grant execute on function public.rpc_update_standalone_transaction(uuid, numeric, timestamptz, uuid, uuid, uuid) to authenticated;
grant execute on function public.rpc_delete_standalone_transaction(uuid) to authenticated;
