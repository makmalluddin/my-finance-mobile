begin;

\ir helpers.inc

select plan(30);

select public.test_create_user('alice-funds@example.com') as alice \gset
select public.test_create_user('bob-funds@example.com') as bob \gset

set local role authenticated;
select public.test_set_claims(:'alice');

select public.test_create_fund('Zero Fund', 0, 'active') as zero_fund \gset
select public.test_create_fund('BCA', 1000000, 'active') as bca \gset
select public.test_create_fund('Savings', 500000, 'savings_goal') as savings \gset
select public.test_create_fund('Empty Fund', 0, 'active') as empty_fund \gset
select public.test_create_fund('Pocket Fund', 0, 'active') as pocket_fund \gset
select public.test_create_fund('Income Fund', 100000, 'active') as income_fund \gset

select is(
  (select opening_balance from public.funds where id = :'zero_fund'),
  0::numeric,
  'FUND-001: Fund dapat dibuat dengan Opening Balance 0'
);

select is(
  (select public.fund_balance(:'bca')),
  1000000::numeric,
  'FUND-008: saldo Fund sama dengan Opening Balance'
);

select throws_ok(
  $$ select public.rpc_create_fund('   ', 0, 'active') $$,
  'P0001',
  'VALIDATION_ERROR',
  'FUND-003: nama Fund kosong ditolak'
);

select throws_ok(
  $$ select public.rpc_create_fund('Bad Type', 0, 'wallet') $$,
  'P0001',
  'INVALID_FUND_TYPE',
  'FUND: klasifikasi Fund tidak valid ditolak'
);

select throws_ok(
  $$ select public.rpc_create_fund('Negative', -1, 'active') $$,
  'P0001',
  'INVALID_AMOUNT',
  'FUND: Opening Balance negatif ditolak'
);

select lives_ok(
  format(
    'select public.rpc_update_fund(%L, %L, %L)',
    :'savings', 'Savings Renamed', 'active'
  ),
  'FUND-004/006: nama dan klasifikasi Fund dapat diubah'
);

select is(
  (select name from public.funds where id = :'savings'),
  'Savings Renamed',
  'FUND-004: nama Fund tersimpan'
);

select throws_ok(
  format(
    'update public.funds set opening_balance = 1 where id = %L',
    :'bca'
  ),
  'P0001',
  'OPENING_BALANCE_IMMUTABLE',
  'FUND-007: Opening Balance tidak dapat diubah'
);

select lives_ok(
  format(
    'select public.rpc_create_income(500000, now(), %L, %L)',
    :'bca',
    public.test_category('income', 'Salary')
  ),
  'TRX-001: Income valid tercatat'
);

select is(
  (select public.fund_balance(:'bca')),
  1500000::numeric,
  'FUND-009: saldo Fund bertambah setelah Income'
);

select throws_ok(
  format('select public.rpc_archive_fund(%L)', :'bca'),
  'P0001',
  'FUND_BALANCE_NOT_ZERO',
  'FUND-015: Fund dengan saldo tidak dapat diarsipkan'
);

select lives_ok(
  format('select public.rpc_archive_fund(%L)', :'zero_fund'),
  'FUND-014: Fund saldo 0 dapat diarsipkan'
);

select is(
  (select is_archived from public.funds where id = :'zero_fund'),
  true,
  'FUND-014: status arsip tersimpan'
);

select lives_ok(
  format('select public.rpc_unarchive_fund(%L)', :'zero_fund'),
  'FUND-018: Fund archived dapat diaktifkan kembali'
);

select lives_ok(
  format('select public.rpc_archive_fund(%L)', :'zero_fund'),
  'FUND: Fund saldo 0 dapat diarsipkan kembali'
);

select throws_ok(
  format(
    'select public.rpc_create_income(1000, now(), %L, %L)',
    :'zero_fund',
    public.test_category('income', 'Other Income')
  ),
  'P0001',
  'FUND_ARCHIVED',
  'FUND-017: Fund archived tidak dapat dipakai transaksi setelah diarsipkan'
);

select public.test_create_pocket('Expense Pocket', 'expense') as pocket \gset

insert into public.pocket_items (
  user_id, pocket_id, name, amount, fund_id, status
)
values (
  :'alice', :'pocket', 'Template Item', 10000, :'bca', 'template'
);

insert into public.pocket_items (
  user_id, pocket_id, name, amount, fund_id, status
)
values (
  :'alice', :'pocket', 'Template Item 2', 10000, :'pocket_fund', 'template'
);

select throws_ok(
  format('select public.rpc_archive_fund(%L)', :'bca'),
  'P0001',
  'FUND_REFERENCED_BY_POCKET',
  'FUND-016: Fund yang direferensikan Pocket Item tidak dapat diarsipkan'
);

select lives_ok(
  format('select public.rpc_delete_fund(%L)', :'empty_fund'),
  'FUND-019: Fund tanpa referensi dapat dihapus'
);

select is(
  (select count(*) from public.funds where id = :'empty_fund'),
  0::bigint,
  'FUND-019: Fund benar-benar terhapus'
);

select lives_ok(
  format(
    'select public.rpc_create_expense(25000, now(), %L, %L)',
    :'income_fund',
    public.test_category('expense', 'Food')
  ),
  'TRX-002: Expense valid tercatat'
);

select throws_ok(
  format('select public.rpc_delete_fund(%L)', :'income_fund'),
  'P0001',
  'FUND_HAS_TRANSACTIONS',
  'FUND-020: Fund dengan transaksi tidak dapat dihapus'
);

select throws_ok(
  format('select public.rpc_delete_fund(%L)', :'pocket_fund'),
  'P0001',
  'FUND_REFERENCED_BY_POCKET',
  'FUND-021: Fund yang direferensikan Pocket Item tidak dapat dihapus'
);

select set_config('request.jwt.claims', '', true);

select throws_ok(
  $$ select public.rpc_create_fund('No Session', 0, 'active') $$,
  'P0001',
  'UNAUTHENTICATED',
  'INT-006: RPC tanpa sesi ditolak'
);

select public.test_set_claims(:'alice');

select is(
  (select count(*) from public.categories where is_active),
  10::bigint,
  'CAT-001/002: sepuluh Category sistem tersedia'
);

select public.test_set_claims(:'bob');

select is(
  (select count(*) from public.rpc_get_fund_balances(true)),
  0::bigint,
  'AUTH-003: pengguna lain tidak melihat Fund milik pengguna pertama'
);

select throws_ok(
  format('select public.rpc_update_fund(%L, %L, %L)', :'bca', 'Hijack', 'active'),
  'P0001',
  'FUND_NOT_FOUND',
  'AUTH-003: pengguna lain tidak dapat mengubah Fund orang lain'
);

select public.test_set_claims(:'alice');

reset role;

delete from auth.users where id = :'alice';

select is(
  (select count(*) from public.funds where user_id = :'alice'),
  0::bigint,
  'AUTH-004: Fund ikut terhapus saat user dihapus'
);

select is(
  (select count(*) from public.pockets where user_id = :'alice'),
  0::bigint,
  'AUTH-004: Pocket ikut terhapus saat user dihapus'
);

select is(
  (select count(*) from public.pocket_items where user_id = :'alice'),
  0::bigint,
  'AUTH-004: Pocket Item ikut terhapus saat user dihapus'
);

select is(
  (select count(*) from public.transactions where user_id = :'alice'),
  0::bigint,
  'AUTH-004: Transaction ikut terhapus saat user dihapus'
);

select * from finish();
rollback;
