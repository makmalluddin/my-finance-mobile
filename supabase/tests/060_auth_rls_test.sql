begin;

\ir helpers.inc

select no_plan();

select public.test_create_user('alice-rls@example.com') as alice \gset
select public.test_create_user('bob-rls@example.com') as bob \gset

set local role authenticated;
select public.test_set_claims(:'alice');

select public.test_create_fund('Alice Fund', 100000, 'active') as alice_fund \gset
select public.test_create_pocket('Alice Income Pocket', 'income') as alice_pocket \gset
select public.test_create_income_item(:'alice_pocket', 'Alice Item', 10000) as alice_item \gset
select public.test_confirm_income_item(:'alice_item', :'alice_fund') as alice_tx \gset

select public.test_create_pocket('Alice Automation Pocket', 'income') as auto_pocket \gset
select public.test_create_automation(
  :'auto_pocket', 'Alice Automation', 5000, :'alice_fund', 'weekly',
  '2026-01-01', 'UTC'
) as alice_auto \gset

select public.rpc_process_due_automations('2026-01-01 00:00:00+00');

select id as alice_occurrence
from public.automation_occurrences
where automation_id = :'alice_auto'
limit 1
\gset

select is(
  (select count(*) from public.funds where user_id = :'alice'),
  1::bigint,
  'AUTH-001: pengguna dapat membaca Fund miliknya'
);

select is(
  (select count(*) from public.transactions where user_id = :'alice'),
  1::bigint,
  'AUTH-001: pengguna dapat membaca transaksi miliknya'
);

select is(
  (select count(*) from public.notifications where user_id = :'alice'),
  1::bigint,
  'AUTH-001: pengguna dapat membaca Notification miliknya'
);

select is(
  (select count(*) from public.categories where is_active),
  10::bigint,
  'CAT-001: pengguna terautentikasi dapat membaca Category aktif'
);

-- ---------------------------------------------------------------------------
-- AUTH-003: pengguna lain tidak dapat membaca data melalui tabel/view langsung
-- ---------------------------------------------------------------------------

select public.test_set_claims(:'bob');

select is(
  (select count(*) from public.funds),
  0::bigint,
  'AUTH-003: RLS menyembunyikan Fund pengguna lain'
);

select is(
  (select count(*) from public.pockets),
  0::bigint,
  'AUTH-003: RLS menyembunyikan Pocket pengguna lain'
);

select is(
  (select count(*) from public.pocket_items),
  0::bigint,
  'AUTH-003: RLS menyembunyikan Pocket Item pengguna lain'
);

select is(
  (select count(*) from public.transactions),
  0::bigint,
  'AUTH-003: RLS menyembunyikan Transaction pengguna lain'
);

select is(
  (select count(*) from public.automations),
  0::bigint,
  'AUTH-003: RLS menyembunyikan Automation pengguna lain'
);

select is(
  (select count(*) from public.automation_occurrences),
  0::bigint,
  'AUTH-003: RLS menyembunyikan occurrence pengguna lain'
);

select is(
  (select count(*) from public.notifications),
  0::bigint,
  'AUTH-003: RLS menyembunyikan Notification pengguna lain'
);

select is(
  (select count(*) from public.v_fund_balances),
  0::bigint,
  'AUTH-003: view saldo Fund tetap mengikuti RLS'
);

select is(
  (select count(*) from public.v_pending_notifications),
  0::bigint,
  'AUTH-003: view Notification pending tetap mengikuti RLS'
);

select is(
  (select count(*) from public.rpc_get_pending_notifications()),
  0::bigint,
  'AUTH-003: RPC Notification hanya mengembalikan milik pengguna'
);

select is(
  public.test_update_fund_name(:'alice_fund', 'Hijacked'),
  0,
  'AUTH-003: pengguna lain tidak dapat mengubah Fund'
);

select is(
  public.test_delete_transaction(:'alice_tx'),
  0,
  'AUTH-003: pengguna lain tidak dapat menghapus transaksi'
);

select is(
  public.test_update_occurrence_status(:'alice_occurrence', 'rejected'),
  0,
  'AUTH-003: pengguna lain tidak dapat mengubah occurrence'
);

-- ---------------------------------------------------------------------------
-- AUTH-003: RLS + composite foreign key mencegah penulisan lintas pengguna
-- ---------------------------------------------------------------------------

select throws_ok(
  format(
    'insert into public.funds (user_id, name, opening_balance, fund_type) values (%L, %L, 0, %L)',
    :'alice', 'Hijack Fund', 'active'
  ),
  '42501',
  null,
  'AUTH-003: insert Fund dengan user_id orang lain ditolak RLS'
);

select public.test_create_pocket('Bob Pocket', 'income') as bob_pocket \gset

select throws_ok(
  format(
    'insert into public.pocket_items (user_id, pocket_id, name, amount, status) values (%L, %L, %L, 1000, %L)',
    :'bob', :'alice_pocket', 'Hijack Item', 'pending'
  ),
  'P0001',
  'POCKET_NOT_FOUND',
  'AUTH-003: Pocket Item tidak dapat menempel ke Pocket orang lain'
);

select throws_ok(
  format(
    'insert into public.transactions (user_id, type, amount, occurred_at, destination_fund_id, category_id) values (%L, %L, 1000, now(), %L, %L)',
    :'bob', 'income', :'alice_fund', public.test_category('income', 'Salary')
  ),
  'P0001',
  'FUND_NOT_FOUND',
  'AUTH-003: transaksi tidak dapat memakai Fund orang lain'
);

select throws_ok(
  format(
    'select public.rpc_create_income(1000, now(), %L, %L)',
    :'alice_fund', public.test_category('income', 'Salary')
  ),
  'P0001',
  'FUND_NOT_FOUND',
  'AUTH-003: RPC Income menolak Fund orang lain'
);

select throws_ok(
  format('select public.rpc_update_fund(%L, %L, %L)', :'alice_fund', 'Hijack', 'active'),
  'P0001',
  'FUND_NOT_FOUND',
  'AUTH-003: RPC Fund menolak ID Fund orang lain'
);

select throws_ok(
  format('select public.rpc_delete_pocket(%L)', :'alice_pocket'),
  'P0001',
  'POCKET_NOT_FOUND',
  'AUTH-003: RPC Pocket menolak ID Pocket orang lain'
);

select throws_ok(
  format('select public.rpc_confirm_occurrence(%L, %L, NULL)', :'alice_occurrence', :'alice_fund'),
  'P0001',
  'OCCURRENCE_NOT_FOUND',
  'AUTH-003: RPC occurrence menolak occurrence orang lain'
);

select throws_ok(
  format('select public.rpc_delete_automation(%L)', :'alice_auto'),
  'P0001',
  'AUTOMATION_NOT_FOUND',
  'AUTH-003: RPC Automation menolak Automation orang lain'
);

-- ---------------------------------------------------------------------------
-- Category adalah data referensi sistem
-- ---------------------------------------------------------------------------

select throws_ok(
  $$ insert into public.categories (type, name, sort_order) values ('income', 'Hacked', 99) $$,
  '42501',
  null,
  'CAT-002: pengguna tidak dapat menambah Category sistem'
);

select throws_ok(
  format(
    'update public.categories set name = %L where type = %L and name = %L',
    'Hacked', 'income', 'Salary'
  ),
  '42501',
  null,
  'CAT-002: pengguna tidak dapat mengubah Category sistem'
);

select throws_ok(
  $$ delete from public.categories where type = 'income' and name = 'Salary' $$,
  '42501',
  null,
  'CAT-002: pengguna tidak dapat menghapus Category sistem'
);

-- ---------------------------------------------------------------------------
-- INT-006: akses tanpa identitas atau dengan role anon
-- ---------------------------------------------------------------------------

select set_config('request.jwt.claims', '', true);

select throws_ok(
  $$ select public.rpc_create_fund('No Session', 0, 'active') $$,
  'P0001',
  'UNAUTHENTICATED',
  'INT-006: RPC tanpa sesi ditolak'
);

select is(
  (select count(*) from public.funds),
  0::bigint,
  'INT-006: RLS menolak pembacaan tanpa identitas'
);

select public.test_set_claims(:'bob');

reset role;
set local role anon;

select throws_ok(
  $$ select count(*) from public.funds $$,
  '42501',
  null,
  'INT-006: role anon tidak dapat membaca tabel keuangan'
);

select throws_ok(
  $$ select count(*) from public.categories $$,
  '42501',
  null,
  'INT-006: role anon tidak dapat membaca Category'
);

select throws_ok(
  $$ select public.rpc_create_fund('Anon', 0, 'active') $$,
  '42501',
  null,
  'INT-006: role anon tidak dapat mengeksekusi RPC'
);

reset role;
set local role authenticated;
select public.test_set_claims(:'alice');

select is(
  (select count(*) from public.funds where id = :'alice_fund'),
  1::bigint,
  'AUTH-001: data pengguna tetap utuh setelah akses ditolak'
);

reset role;

select * from finish();
rollback;
