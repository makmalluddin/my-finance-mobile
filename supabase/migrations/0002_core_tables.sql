-- 0002_core_tables.sql
-- Tabel inti: funds, categories, pockets, pocket_items, transactions.
-- Foreign key komposit untuk kepemilikan ditambahkan pada 0004.

create table public.funds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (btrim(name) <> ''),
  opening_balance numeric(14,2) not null default 0 check (opening_balance >= 0),
  fund_type text not null check (fund_type in ('active', 'savings_goal')),
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('income', 'expense')),
  name text not null,
  sort_order smallint not null,
  is_active boolean not null default true,
  unique (type, name)
);

create table public.pockets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (btrim(name) <> ''),
  description text,
  type text not null check (type in ('income', 'expense', 'transfer')),
  is_archived boolean not null default false,
  has_ever_had_item boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.pocket_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pocket_id uuid not null,
  name text not null check (btrim(name) <> ''),
  amount numeric(14,2) not null check (amount > 0),
  fund_id uuid,
  status text not null check (
    status in ('pending', 'confirmed', 'template', 'planned', 'converted', 'completed')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('income', 'expense', 'transfer')),
  amount numeric(14,2) not null check (amount > 0),
  occurred_at timestamptz not null,
  source_fund_id uuid,
  destination_fund_id uuid,
  category_id uuid references public.categories(id) on delete restrict,
  pocket_item_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
