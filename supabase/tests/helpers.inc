-- Helper untuk pgTAP. Tidak dijalankan sebagai test file (ekstensi .inc).

create or replace function public.test_create_user(p_email text)
returns uuid
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_id uuid := gen_random_uuid();
begin
  insert into auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  )
  values (
    v_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    p_email,
    'test-password-hash',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  );

  return v_id;
end;
$$;

create or replace function public.test_set_claims(p_user uuid)
returns void
language sql
security invoker
as $$
  select set_config(
    'request.jwt.claims',
    json_build_object('sub', p_user, 'role', 'authenticated')::text,
    true
  );
$$;

create or replace function public.test_create_fund(
  p_name text,
  p_opening numeric default 0,
  p_type text default 'active'
)
returns uuid
language plpgsql
security invoker
as $$
declare
  v_fund public.funds%rowtype;
begin
  v_fund := public.rpc_create_fund(p_name, p_opening, p_type);
  return v_fund.id;
end;
$$;

create or replace function public.test_create_pocket(
  p_name text,
  p_type text
)
returns uuid
language plpgsql
security invoker
as $$
declare
  v_pocket public.pockets%rowtype;
begin
  v_pocket := public.rpc_create_pocket(p_name, null, p_type);
  return v_pocket.id;
end;
$$;

create or replace function public.test_create_income_item(
  p_pocket_id uuid,
  p_name text,
  p_amount numeric
)
returns uuid
language plpgsql
security invoker
as $$
declare
  v_item public.pocket_items%rowtype;
begin
  v_item := public.rpc_create_income_item(p_pocket_id, p_name, p_amount);
  return v_item.id;
end;
$$;

create or replace function public.test_create_planned_item(
  p_pocket_id uuid,
  p_name text,
  p_amount numeric
)
returns uuid
language plpgsql
security invoker
as $$
declare
  v_item public.pocket_items%rowtype;
begin
  v_item := public.rpc_create_planned_expense_item(p_pocket_id, p_name, p_amount);
  return v_item.id;
end;
$$;

create or replace function public.test_category(
  p_type text,
  p_name text
)
returns uuid
language sql
stable
security invoker
as $$
  select id from public.categories
  where type = p_type and name = p_name and is_active
  limit 1;
$$;

create or replace function public.test_income(
  p_amount numeric,
  p_occurred_at timestamptz,
  p_destination_fund_id uuid,
  p_category_id uuid
)
returns uuid
language plpgsql
security invoker
as $$
declare
  v_tx public.transactions%rowtype;
begin
  v_tx := public.rpc_create_income(p_amount, p_occurred_at, p_destination_fund_id, p_category_id);
  return v_tx.id;
end;
$$;

create or replace function public.test_expense(
  p_amount numeric,
  p_occurred_at timestamptz,
  p_source_fund_id uuid,
  p_category_id uuid
)
returns uuid
language plpgsql
security invoker
as $$
declare
  v_tx public.transactions%rowtype;
begin
  v_tx := public.rpc_create_expense(p_amount, p_occurred_at, p_source_fund_id, p_category_id);
  return v_tx.id;
end;
$$;

create or replace function public.test_transfer(
  p_amount numeric,
  p_occurred_at timestamptz,
  p_source_fund_id uuid,
  p_destination_fund_id uuid
)
returns uuid
language plpgsql
security invoker
as $$
declare
  v_tx public.transactions%rowtype;
begin
  v_tx := public.rpc_create_transfer(p_amount, p_occurred_at, p_source_fund_id, p_destination_fund_id);
  return v_tx.id;
end;
$$;

create or replace function public.test_confirm_income_item(
  p_item_id uuid,
  p_destination_fund_id uuid
)
returns uuid
language plpgsql
security invoker
as $$
declare
  v_tx public.transactions%rowtype;
begin
  v_tx := public.rpc_confirm_income_item(p_item_id, p_destination_fund_id);
  return v_tx.id;
end;
$$;

create or replace function public.test_convert_planned_expense(
  p_item_id uuid,
  p_source_fund_id uuid
)
returns uuid
language plpgsql
security invoker
as $$
declare
  v_tx public.transactions%rowtype;
begin
  v_tx := public.rpc_convert_planned_expense(p_item_id, p_source_fund_id);
  return v_tx.id;
end;
$$;

create or replace function public.test_transfer_item(
  p_pocket_id uuid,
  p_name text,
  p_amount numeric,
  p_source_fund_id uuid,
  p_destination_fund_id uuid,
  p_occurred_at timestamptz
)
returns uuid
language plpgsql
security invoker
as $$
declare
  v_item public.pocket_items%rowtype;
begin
  v_item := public.rpc_create_transfer_item(
    p_pocket_id,
    p_name,
    p_amount,
    p_source_fund_id,
    p_destination_fund_id,
    p_occurred_at
  );
  return v_item.id;
end;
$$;

create or replace function public.test_create_automation(
  p_pocket_id uuid,
  p_name text,
  p_amount numeric,
  p_fund_id uuid,
  p_frequency text,
  p_start_date date,
  p_timezone text
)
returns uuid
language plpgsql
security invoker
as $$
declare
  v_automation public.automations%rowtype;
begin
  v_automation := public.rpc_create_automation(
    p_pocket_id,
    p_name,
    p_amount,
    p_fund_id,
    p_frequency,
    p_start_date,
    p_timezone
  );
  return v_automation.id;
end;
$$;

create or replace function public.test_confirm_occurrence(
  p_occurrence_id uuid,
  p_fund_id uuid,
  p_amount numeric default null
)
returns uuid
language plpgsql
security invoker
as $$
declare
  v_tx public.transactions%rowtype;
begin
  v_tx := public.rpc_confirm_occurrence(p_occurrence_id, p_fund_id, p_amount);
  return v_tx.id;
end;
$$;

create or replace function public.test_update_fund_name(
  p_fund_id uuid,
  p_name text
)
returns integer
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_count integer;
begin
  update public.funds set name = p_name where id = p_fund_id;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

create or replace function public.test_delete_transaction(p_transaction_id uuid)
returns integer
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_count integer;
begin
  delete from public.transactions where id = p_transaction_id;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

create or replace function public.test_update_occurrence_status(
  p_occurrence_id uuid,
  p_status text
)
returns integer
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_count integer;
begin
  update public.automation_occurrences
  set status = p_status
  where id = p_occurrence_id;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;
