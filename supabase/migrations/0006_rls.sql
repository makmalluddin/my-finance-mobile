-- 0006_rls.sql
-- Row Level Security untuk seluruh tabel milik pengguna. Kepemilikan anak
-- juga dijaga oleh composite foreign key ke (id, user_id).

alter table public.funds enable row level security;
alter table public.categories enable row level security;
alter table public.pockets enable row level security;
alter table public.pocket_items enable row level security;
alter table public.transactions enable row level security;
alter table public.automations enable row level security;
alter table public.automation_occurrences enable row level security;
alter table public.notifications enable row level security;

create policy funds_owner
  on public.funds
  for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy pockets_owner
  on public.pockets
  for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy pocket_items_owner
  on public.pocket_items
  for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy transactions_owner
  on public.transactions
  for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy automations_owner
  on public.automations
  for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy automation_occurrences_owner
  on public.automation_occurrences
  for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy notifications_owner
  on public.notifications
  for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Category adalah data referensi sistem: hanya baca untuk pengguna.
create policy categories_read_active
  on public.categories
  for select
  to authenticated
  using (is_active);

-- Hak akses tabel. RLS tetap membatasi baris yang dapat diakses.
revoke all on public.funds from anon;
revoke all on public.categories from anon;
revoke all on public.pockets from anon;
revoke all on public.pocket_items from anon;
revoke all on public.transactions from anon;
revoke all on public.automations from anon;
revoke all on public.automation_occurrences from anon;
revoke all on public.notifications from anon;

grant select, insert, update, delete on public.funds to authenticated;

-- Supabase memberi privilege penuh ke `authenticated` lewat default grant.
-- Category adalah data referensi sistem, sehingga hak tulis harus dicabut
-- secara eksplisit; RLS saja hanya menyembunyikan baris, bukan menolak DML.
revoke insert, update, delete, truncate on public.categories from authenticated;
grant select on public.categories to authenticated;
grant select, insert, update, delete on public.pockets to authenticated;
grant select, insert, update, delete on public.pocket_items to authenticated;
grant select, insert, update, delete on public.transactions to authenticated;
grant select, insert, update, delete on public.automations to authenticated;
grant select, insert, update, delete on public.automation_occurrences to authenticated;
grant select, insert, update, delete on public.notifications to authenticated;
