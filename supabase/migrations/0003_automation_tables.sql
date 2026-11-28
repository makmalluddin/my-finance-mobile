-- 0003_automation_tables.sql
-- Tabel Automation, occurrence, dan Notification.

create table public.automations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pocket_item_id uuid not null,
  frequency text not null check (frequency in ('weekly', 'every_two_weeks', 'monthly')),
  start_date date not null,
  next_run_at timestamptz not null,
  timezone text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.automation_occurrences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  automation_id uuid,
  pocket_item_id uuid not null,
  scheduled_for timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'rejected')),
  confirmed_amount numeric(14,2) check (confirmed_amount > 0),
  transaction_id uuid,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint automation_occurrences_lifecycle_check check (
    (status = 'pending' and transaction_id is null and processed_at is null and confirmed_amount is null)
    or (status = 'confirmed' and transaction_id is not null and processed_at is not null and confirmed_amount is not null)
    or (status = 'rejected' and transaction_id is null and processed_at is not null and confirmed_amount is null)
  )
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  occurrence_id uuid not null,
  created_at timestamptz not null default now()
);
