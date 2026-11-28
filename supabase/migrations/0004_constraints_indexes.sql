-- 0004_constraints_indexes.sql
-- Composite ownership keys, foreign keys, check constraints, indexes, dan
-- trigger pertahanan tambahan. Sumber kebenaran validasi tetap RPC.

-- ---------------------------------------------------------------------------
-- 1. Composite unique keys untuk mendukung composite foreign key
-- ---------------------------------------------------------------------------

alter table public.funds
  add constraint funds_id_user_id_key unique (id, user_id);

alter table public.categories
  add constraint categories_id_type_key unique (id, type);

alter table public.pockets
  add constraint pockets_id_user_id_key unique (id, user_id);

alter table public.pocket_items
  add constraint pocket_items_id_user_id_key unique (id, user_id);

alter table public.transactions
  add constraint transactions_id_user_id_key unique (id, user_id);

alter table public.automations
  add constraint automations_id_user_id_key unique (id, user_id);

alter table public.automation_occurrences
  add constraint automation_occurrences_id_user_id_key unique (id, user_id);

-- ---------------------------------------------------------------------------
-- 2. Composite foreign keys (kepemilikan lintas tabel)
-- ---------------------------------------------------------------------------

alter table public.pocket_items
  add constraint pocket_items_pocket_fk
    foreign key (pocket_id, user_id)
    references public.pockets (id, user_id)
    on delete cascade,
  add constraint pocket_items_fund_fk
    foreign key (fund_id, user_id)
    references public.funds (id, user_id)
    on delete restrict;

alter table public.transactions
  add constraint transactions_source_fund_fk
    foreign key (source_fund_id, user_id)
    references public.funds (id, user_id)
    on delete restrict,
  add constraint transactions_destination_fund_fk
    foreign key (destination_fund_id, user_id)
    references public.funds (id, user_id)
    on delete restrict,
  add constraint transactions_pocket_item_fk
    foreign key (pocket_item_id, user_id)
    references public.pocket_items (id, user_id)
    on delete set null (pocket_item_id),
  add constraint transactions_category_type_fk
    foreign key (category_id, type)
    references public.categories (id, type)
    on delete restrict;

alter table public.automations
  add constraint automations_pocket_item_fk
    foreign key (pocket_item_id, user_id)
    references public.pocket_items (id, user_id)
    on delete cascade;

alter table public.automation_occurrences
  add constraint automation_occurrences_automation_fk
    foreign key (automation_id, user_id)
    references public.automations (id, user_id)
    on delete cascade,
  add constraint automation_occurrences_pocket_item_fk
    foreign key (pocket_item_id, user_id)
    references public.pocket_items (id, user_id)
    on delete cascade,
  add constraint automation_occurrences_transaction_fk
    foreign key (transaction_id, user_id)
    references public.transactions (id, user_id)
    on delete cascade;

alter table public.notifications
  add constraint notifications_occurrence_fk
    foreign key (occurrence_id, user_id)
    references public.automation_occurrences (id, user_id)
    on delete cascade;

-- ---------------------------------------------------------------------------
-- 3. Check constraints
-- ---------------------------------------------------------------------------

alter table public.pocket_items
  add constraint pocket_items_template_fund_check check (
    (status = 'template' and fund_id is not null)
    or (status <> 'template' and fund_id is null)
  );

alter table public.transactions
  add constraint transactions_shape_check check (
    (type = 'income' and source_fund_id is null and destination_fund_id is not null)
    or (type = 'expense' and source_fund_id is not null and destination_fund_id is null)
    or (
      type = 'transfer'
      and source_fund_id is not null
      and destination_fund_id is not null
      and source_fund_id <> destination_fund_id
    )
  ),
  add constraint transactions_category_check check (
    case
      when type = 'transfer' then category_id is null
      when pocket_item_id is not null then category_id is null
      else category_id is not null
    end
  );

-- ---------------------------------------------------------------------------
-- 4. Unique indexes and indexes for query patterns
-- ---------------------------------------------------------------------------

create unique index automation_occurrences_automation_scheduled_key
  on public.automation_occurrences (automation_id, scheduled_for);

create unique index automation_occurrences_transaction_id_key
  on public.automation_occurrences (transaction_id)
  where transaction_id is not null;

create unique index automations_active_pocket_item_key
  on public.automations (pocket_item_id)
  where is_active;

create unique index notifications_occurrence_id_key
  on public.notifications (occurrence_id);

create index funds_user_archive_type_idx
  on public.funds (user_id, is_archived, fund_type);

create index transactions_user_occurred_at_idx
  on public.transactions (user_id, occurred_at desc);

create index transactions_user_type_occurred_at_idx
  on public.transactions (user_id, type, occurred_at desc);

create index transactions_source_fund_occurred_at_idx
  on public.transactions (source_fund_id, occurred_at desc);

create index transactions_destination_fund_occurred_at_idx
  on public.transactions (destination_fund_id, occurred_at desc);

create index transactions_pocket_item_idx
  on public.transactions (pocket_item_id)
  where pocket_item_id is not null;

create index pocket_items_pocket_status_idx
  on public.pocket_items (pocket_id, status);

create index pocket_items_fund_idx
  on public.pocket_items (fund_id)
  where fund_id is not null;

create index automations_due_idx
  on public.automations (is_active, next_run_at);

create index automation_occurrences_user_status_scheduled_idx
  on public.automation_occurrences (user_id, status, scheduled_for);

create index notifications_user_created_at_idx
  on public.notifications (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- 5. Trigger functions
-- ---------------------------------------------------------------------------

create or replace function public.funds_opening_balance_immutable()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if new.opening_balance is distinct from old.opening_balance then
    perform public.raise_app_error(
      'OPENING_BALANCE_IMMUTABLE',
      jsonb_build_object('fund_id', old.id)
    );
  end if;
  return new;
end;
$$;

create or replace function public.pockets_type_immutable()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if new.type is distinct from old.type and old.has_ever_had_item then
    perform public.raise_app_error(
      'POCKET_TYPE_IMMUTABLE',
      jsonb_build_object('pocket_id', old.id)
    );
  end if;

  if old.has_ever_had_item and not new.has_ever_had_item then
    perform public.raise_app_error(
      'VALIDATION_ERROR',
      jsonb_build_object('reason', 'has_ever_had_item_is_monotonic', 'pocket_id', old.id)
    );
  end if;

  return new;
end;
$$;

create or replace function public.pocket_items_validate()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_pocket public.pockets%rowtype;
  v_fund public.funds%rowtype;
begin
  select * into v_pocket
  from public.pockets
  where id = new.pocket_id;

  if not found then
    perform public.raise_app_error(
      'POCKET_NOT_FOUND',
      jsonb_build_object('pocket_id', new.pocket_id)
    );
  end if;

  if tg_op = 'INSERT' and v_pocket.is_archived then
    perform public.raise_app_error(
      'POCKET_ARCHIVED',
      jsonb_build_object('pocket_id', v_pocket.id)
    );
  end if;

  if tg_op = 'UPDATE' and new.pocket_id is distinct from old.pocket_id then
    perform public.raise_app_error(
      'VALIDATION_ERROR',
      jsonb_build_object('reason', 'pocket_item_pocket_immutable', 'item_id', old.id)
    );
  end if;

  if not (
    (v_pocket.type = 'income' and new.status in ('pending', 'confirmed', 'template'))
    or (v_pocket.type = 'expense' and new.status in ('planned', 'converted', 'template'))
    or (v_pocket.type = 'transfer' and new.status = 'completed')
  ) then
    perform public.raise_app_error(
      'POCKET_TYPE_MISMATCH',
      jsonb_build_object(
        'pocket_id', v_pocket.id,
        'pocket_type', v_pocket.type,
        'status', new.status
      )
    );
  end if;

  if tg_op = 'UPDATE' then
    if old.status = 'template' and new.status <> 'template' then
      perform public.raise_app_error(
        'POCKET_ITEM_STATUS_INVALID',
        jsonb_build_object('item_id', old.id, 'reason', 'template_status_immutable')
      );
    end if;

    if old.status <> 'template' and new.status = 'template' then
      perform public.raise_app_error(
        'POCKET_ITEM_STATUS_INVALID',
        jsonb_build_object('item_id', old.id, 'reason', 'template_status_immutable')
      );
    end if;
  end if;

  if new.status = 'template' then
    if new.fund_id is null then
      perform public.raise_app_error(
        'VALIDATION_ERROR',
        jsonb_build_object('reason', 'template_fund_required', 'item_id', new.id)
      );
    end if;

    select * into v_fund
    from public.funds
    where id = new.fund_id;

    if not found then
      perform public.raise_app_error(
        'FUND_NOT_FOUND',
        jsonb_build_object('fund_id', new.fund_id)
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
  end if;

  if new.status <> 'template' and new.fund_id is not null then
    perform public.raise_app_error(
      'VALIDATION_ERROR',
      jsonb_build_object('reason', 'fund_only_for_template', 'item_id', new.id)
    );
  end if;

  if tg_op = 'INSERT' then
    update public.pockets
    set has_ever_had_item = true
    where id = new.pocket_id
      and not has_ever_had_item;
  end if;

  return new;
end;
$$;

create or replace function public.transactions_validate()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_fund public.funds%rowtype;
  v_category public.categories%rowtype;
  v_item public.pocket_items%rowtype;
  v_pocket public.pockets%rowtype;
  v_detach_only boolean := false;
begin
  if tg_op = 'UPDATE' then
    if new.type is distinct from old.type then
      perform public.raise_app_error(
        'TRANSACTION_TYPE_IMMUTABLE',
        jsonb_build_object('transaction_id', old.id, 'type', old.type)
      );
    end if;

    v_detach_only :=
      old.pocket_item_id is not null
      and new.pocket_item_id is null
      and new.type is not distinct from old.type
      and new.amount is not distinct from old.amount
      and new.occurred_at is not distinct from old.occurred_at
      and new.source_fund_id is not distinct from old.source_fund_id
      and new.destination_fund_id is not distinct from old.destination_fund_id;
  end if;

  -- Saat transaksi dilepas dari Pocket/Automation, isi Category fallback.
  if v_detach_only and new.category_id is null and new.type in ('income', 'expense') then
    select c.id into new.category_id
    from public.categories c
    where c.type = new.type
      and c.is_active
      and c.name = case when new.type = 'income' then 'Other Income' else 'Other' end
    limit 1;

    if new.category_id is null then
      perform public.raise_app_error(
        'CATEGORY_NOT_FOUND',
        jsonb_build_object('reason', 'fallback_category_missing', 'type', new.type)
      );
    end if;
  end if;

  -- Validasi Fund dilewati saat update hanya melepas Pocket Item. Fund yang
  -- sudah diarsipkan tidak boleh memblokir proses detach.
  if not v_detach_only then
    if new.source_fund_id is not null then
      select * into v_fund
      from public.funds
      where id = new.source_fund_id;

      if not found then
        perform public.raise_app_error(
          'FUND_NOT_FOUND',
          jsonb_build_object('fund_id', new.source_fund_id)
        );
      end if;

      if v_fund.is_archived then
        perform public.raise_app_error(
          'FUND_ARCHIVED',
          jsonb_build_object('fund_id', v_fund.id)
        );
      end if;

      if new.type = 'expense' and v_fund.fund_type <> 'active' then
        perform public.raise_app_error(
          'SOURCE_FUND_NOT_ACTIVE',
          jsonb_build_object('fund_id', v_fund.id, 'fund_type', v_fund.fund_type)
        );
      end if;
    end if;

    if new.destination_fund_id is not null then
      select * into v_fund
      from public.funds
      where id = new.destination_fund_id;

      if not found then
        perform public.raise_app_error(
          'FUND_NOT_FOUND',
          jsonb_build_object('fund_id', new.destination_fund_id)
        );
      end if;

      if v_fund.is_archived then
        perform public.raise_app_error(
          'FUND_ARCHIVED',
          jsonb_build_object('fund_id', v_fund.id)
        );
      end if;
    end if;
  end if;

  if new.type = 'transfer' and new.category_id is not null then
    perform public.raise_app_error(
      'CATEGORY_FORBIDDEN',
      jsonb_build_object('transaction_id', new.id, 'reason', 'transfer_with_category')
    );
  end if;

  if new.pocket_item_id is not null and new.category_id is not null then
    perform public.raise_app_error(
      'CATEGORY_FORBIDDEN',
      jsonb_build_object('transaction_id', new.id, 'reason', 'pocket_transaction_with_category')
    );
  end if;

  if new.category_id is not null then
    select * into v_category
    from public.categories
    where id = new.category_id;

    if not found or not v_category.is_active then
      perform public.raise_app_error(
        'CATEGORY_NOT_FOUND',
        jsonb_build_object('category_id', new.category_id)
      );
    end if;

    if v_category.type <> new.type then
      perform public.raise_app_error(
        'CATEGORY_TYPE_MISMATCH',
        jsonb_build_object(
          'category_id', v_category.id,
          'category_type', v_category.type,
          'transaction_type', new.type
        )
      );
    end if;
  end if;

  if new.pocket_item_id is null and new.type in ('income', 'expense') and new.category_id is null then
    perform public.raise_app_error(
      'CATEGORY_REQUIRED',
      jsonb_build_object('transaction_id', new.id, 'type', new.type)
    );
  end if;

  if new.pocket_item_id is not null then
    select * into v_item
    from public.pocket_items
    where id = new.pocket_item_id;

    if not found then
      perform public.raise_app_error(
        'POCKET_ITEM_NOT_FOUND',
        jsonb_build_object('item_id', new.pocket_item_id)
      );
    end if;

    select * into v_pocket
    from public.pockets
    where id = v_item.pocket_id;

    if not found then
      perform public.raise_app_error(
        'POCKET_NOT_FOUND',
        jsonb_build_object('pocket_id', v_item.pocket_id)
      );
    end if;

    if not (
      (v_pocket.type = 'income' and new.type = 'income')
      or (v_pocket.type = 'expense' and new.type = 'expense')
      or (v_pocket.type = 'transfer' and new.type = 'transfer')
    ) then
      perform public.raise_app_error(
        'POCKET_TYPE_MISMATCH',
        jsonb_build_object(
          'pocket_id', v_pocket.id,
          'pocket_type', v_pocket.type,
          'transaction_type', new.type
        )
      );
    end if;

    if v_pocket.type = 'income'
      and v_item.status not in ('pending', 'confirmed', 'template') then
      perform public.raise_app_error(
        'POCKET_ITEM_STATUS_INVALID',
        jsonb_build_object('item_id', v_item.id, 'status', v_item.status)
      );
    end if;

    if v_pocket.type = 'expense'
      and v_item.status not in ('planned', 'converted', 'template') then
      perform public.raise_app_error(
        'POCKET_ITEM_STATUS_INVALID',
        jsonb_build_object('item_id', v_item.id, 'status', v_item.status)
      );
    end if;

    if v_pocket.type = 'transfer' and v_item.status <> 'completed' then
      perform public.raise_app_error(
        'POCKET_ITEM_STATUS_INVALID',
        jsonb_build_object('item_id', v_item.id, 'status', v_item.status)
      );
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.transactions_protect_automation_income()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if exists (
    select 1
    from public.automation_occurrences o
    join public.pocket_items pi on pi.id = o.pocket_item_id
    join public.pockets p on p.id = pi.pocket_id
    where o.transaction_id = old.id
      and o.status = 'confirmed'
      and p.type = 'income'
  ) then
    perform public.raise_app_error(
      'TRANSACTION_PROTECTED',
      jsonb_build_object('transaction_id', old.id, 'reason', 'income_automation')
    );
  end if;

  return old;
end;
$$;

create or replace function public.automations_validate()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_item public.pocket_items%rowtype;
  v_pocket public.pockets%rowtype;
  v_fund public.funds%rowtype;
begin
  select * into v_item
  from public.pocket_items
  where id = new.pocket_item_id;

  if not found then
    perform public.raise_app_error(
      'POCKET_ITEM_NOT_FOUND',
      jsonb_build_object('item_id', new.pocket_item_id)
    );
  end if;

  select * into v_pocket
  from public.pockets
  where id = v_item.pocket_id;

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

  if v_item.status <> 'template' then
    perform public.raise_app_error(
      'POCKET_ITEM_STATUS_INVALID',
      jsonb_build_object('item_id', v_item.id, 'status', v_item.status)
    );
  end if;

  if not public.is_valid_timezone(new.timezone) then
    perform public.raise_app_error(
      'VALIDATION_ERROR',
      jsonb_build_object('reason', 'invalid_timezone', 'timezone', new.timezone)
    );
  end if;

  if tg_op = 'UPDATE' and new.pocket_item_id is distinct from old.pocket_item_id then
    perform public.raise_app_error(
      'VALIDATION_ERROR',
      jsonb_build_object('reason', 'automation_pocket_item_immutable', 'automation_id', old.id)
    );
  end if;

  if new.is_active and exists (
    select 1
    from public.automations a
    where a.pocket_item_id = new.pocket_item_id
      and a.is_active
      and a.id <> new.id
  ) then
    perform public.raise_app_error(
      'CONFLICT',
      jsonb_build_object('reason', 'active_automation_exists', 'item_id', new.pocket_item_id)
    );
  end if;

  if v_item.fund_id is null then
    perform public.raise_app_error(
      'VALIDATION_ERROR',
      jsonb_build_object('reason', 'default_fund_required', 'item_id', v_item.id)
    );
  end if;

  select * into v_fund
  from public.funds
  where id = v_item.fund_id;

  if not found then
    perform public.raise_app_error(
      'FUND_NOT_FOUND',
      jsonb_build_object('fund_id', v_item.fund_id)
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

  return new;
end;
$$;

create or replace function public.automation_occurrences_validate()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_automation_item uuid;
begin
  if tg_op = 'UPDATE' then
    if new.automation_id is distinct from old.automation_id then
      perform public.raise_app_error(
        'VALIDATION_ERROR',
        jsonb_build_object('reason', 'occurrence_automation_immutable', 'occurrence_id', old.id)
      );
    end if;

    if new.pocket_item_id is distinct from old.pocket_item_id then
      perform public.raise_app_error(
        'VALIDATION_ERROR',
        jsonb_build_object('reason', 'occurrence_item_immutable', 'occurrence_id', old.id)
      );
    end if;

    if old.status <> 'pending' and new.status is distinct from old.status then
      perform public.raise_app_error(
        'OCCURRENCE_ALREADY_PROCESSED',
        jsonb_build_object('occurrence_id', old.id, 'status', old.status)
      );
    end if;
  end if;

  if new.automation_id is not null then
    select a.pocket_item_id into v_automation_item
    from public.automations a
    where a.id = new.automation_id;

    if not found then
      perform public.raise_app_error(
        'AUTOMATION_NOT_FOUND',
        jsonb_build_object('automation_id', new.automation_id)
      );
    end if;

    if v_automation_item is distinct from new.pocket_item_id then
      perform public.raise_app_error(
        'VALIDATION_ERROR',
        jsonb_build_object(
          'reason', 'occurrence_item_automation_mismatch',
          'automation_id', new.automation_id,
          'item_id', new.pocket_item_id
        )
      );
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.notifications_only_pending()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_status text;
begin
  select status into v_status
  from public.automation_occurrences
  where id = new.occurrence_id;

  if not found then
    perform public.raise_app_error(
      'OCCURRENCE_NOT_FOUND',
      jsonb_build_object('occurrence_id', new.occurrence_id)
    );
  end if;

  if v_status <> 'pending' then
    perform public.raise_app_error(
      'OCCURRENCE_ALREADY_PROCESSED',
      jsonb_build_object('occurrence_id', new.occurrence_id, 'status', v_status)
    );
  end if;

  return new;
end;
$$;

revoke all on function public.funds_opening_balance_immutable() from public, anon;
revoke all on function public.pockets_type_immutable() from public, anon;
revoke all on function public.pocket_items_validate() from public, anon;
revoke all on function public.transactions_validate() from public, anon;
revoke all on function public.transactions_protect_automation_income() from public, anon;
revoke all on function public.automations_validate() from public, anon;
revoke all on function public.automation_occurrences_validate() from public, anon;
revoke all on function public.notifications_only_pending() from public, anon;

grant execute on function public.funds_opening_balance_immutable() to authenticated;
grant execute on function public.pockets_type_immutable() to authenticated;
grant execute on function public.pocket_items_validate() to authenticated;
grant execute on function public.transactions_validate() to authenticated;
grant execute on function public.transactions_protect_automation_income() to authenticated;
grant execute on function public.automations_validate() to authenticated;
grant execute on function public.automation_occurrences_validate() to authenticated;
grant execute on function public.notifications_only_pending() to authenticated;

-- ---------------------------------------------------------------------------
-- 6. Triggers
-- ---------------------------------------------------------------------------

create trigger funds_set_updated_at
  before update on public.funds
  for each row execute function public.set_updated_at();

create trigger funds_opening_balance_immutable
  before update on public.funds
  for each row execute function public.funds_opening_balance_immutable();

create trigger pockets_set_updated_at
  before update on public.pockets
  for each row execute function public.set_updated_at();

create trigger pockets_type_immutable
  before update on public.pockets
  for each row execute function public.pockets_type_immutable();

create trigger pocket_items_set_updated_at
  before update on public.pocket_items
  for each row execute function public.set_updated_at();

create trigger pocket_items_validate
  before insert or update on public.pocket_items
  for each row execute function public.pocket_items_validate();

create trigger transactions_set_updated_at
  before update on public.transactions
  for each row execute function public.set_updated_at();

create trigger transactions_validate
  before insert or update on public.transactions
  for each row execute function public.transactions_validate();

create trigger transactions_protect_automation_income
  before delete on public.transactions
  for each row execute function public.transactions_protect_automation_income();

create trigger automations_set_updated_at
  before update on public.automations
  for each row execute function public.set_updated_at();

create trigger automations_validate
  before insert or update on public.automations
  for each row execute function public.automations_validate();

create trigger automation_occurrences_validate
  before insert or update on public.automation_occurrences
  for each row execute function public.automation_occurrences_validate();

create trigger notifications_only_pending
  before insert or update on public.notifications
  for each row execute function public.notifications_only_pending();
