begin;

\ir helpers.inc

select plan(42);

select public.test_create_user('alice-trx@example.com') as alice \gset
select public.test_create_user('bob-trx@example.com') as bob \gset

set local role authenticated;
select public.test_set_claims(:'alice');

select public.test_create_fund('Cash', 1000000, 'active') as cash \gset
select public.test_create_fund('Savings', 200000, 'savings_goal') as savings \gset
select public.test_create_fund('Other', 500000, 'active') as other \gset

select public.test_category('income', 'Salary') as salary \gset
select public.test_category('expense', 'Food') as food \gset

select public.test_income(500000, now(), :'cash', :'salary') as income_tx \gset
select public.test_expense(200000, now(), :'cash', :'food') as expense_tx \gset
select public.test_transfer(300000, now(), :'cash', :'savings') as transfer_tx \gset

select is(public.fund_balance(:'cash'), 1000000::numeric, 'TRX-001/002/003: saldo Cash setelah Income, Expense, Transfer');
select is(public.fund_balance(:'savings'), 500000::numeric, 'TRX-003: saldo Fund tujuan Transfer bertambah');

select throws_ok(
  format(
    'select public.rpc_create_income(0, now(), %L, %L)',
    :'cash', :'salary'
  ),
  'P0001',
  'INVALID_AMOUNT',
  'TRX-004: Income amount 0 ditolak'
);

select throws_ok(
  format(
    'select public.rpc_create_expense(-1, now(), %L, %L)',
    :'cash', :'food'
  ),
  'P0001',
  'INVALID_AMOUNT',
  'TRX-005: Expense amount negatif ditolak'
);

select throws_ok(
  format(
    'select public.rpc_create_expense(2000000, now(), %L, %L)',
    :'cash', :'food'
  ),
  'P0001',
  'INSUFFICIENT_BALANCE',
  'TRX-006: Expense melebihi saldo ditolak'
);

select is(public.fund_balance(:'cash'), 1000000::numeric, 'TRX-006: saldo tidak berubah setelah Expense ditolak');

select throws_ok(
  format(
    'select public.rpc_create_transfer(2000000, now(), %L, %L)',
    :'cash', :'other'
  ),
  'P0001',
  'INSUFFICIENT_BALANCE',
  'TRX-007: Transfer melebihi saldo sumber ditolak'
);

select is(public.fund_balance(:'cash'), 1000000::numeric, 'TRX-007: saldo sumber tidak berubah');
select is(public.fund_balance(:'other'), 500000::numeric, 'TRX-007: saldo tujuan tidak berubah');

select throws_ok(
  format(
    'select public.rpc_create_transfer(1000, now(), %L, %L)',
    :'cash', :'cash'
  ),
  'P0001',
  'SAME_FUND_TRANSFER',
  'TRX-008: Transfer ke Fund yang sama ditolak'
);

select throws_ok(
  format(
    'select public.rpc_create_expense(10000, now(), %L, %L)',
    :'savings', :'food'
  ),
  'P0001',
  'SOURCE_FUND_NOT_ACTIVE',
  'TRX-042: Expense dari Savings/Goal Fund ditolak'
);

select throws_ok(
  format(
    'select public.rpc_create_income(10000, now(), %L, NULL)',
    :'cash'
  ),
  'P0001',
  'CATEGORY_REQUIRED',
  'TRX-010: Income tanpa Category ditolak'
);

select throws_ok(
  format(
    'select public.rpc_create_expense(10000, now(), %L, NULL)',
    :'cash'
  ),
  'P0001',
  'CATEGORY_REQUIRED',
  'TRX-011: Expense tanpa Category ditolak'
);

select throws_ok(
  format(
    'select public.rpc_create_income(10000, now(), %L, %L)',
    :'cash', :'food'
  ),
  'P0001',
  'CATEGORY_TYPE_MISMATCH',
  'CAT-004: Category Expense tidak dapat dipakai untuk Income'
);

select throws_ok(
  format(
    'insert into public.transactions (user_id, type, amount, occurred_at, source_fund_id, destination_fund_id, category_id) values (%L, %L, 1000, now(), %L, %L, %L)',
    :'alice', 'transfer', :'cash', :'other', :'food'
  ),
  'P0001',
  'CATEGORY_FORBIDDEN',
  'TRX-012/CAT-005: Transfer tidak boleh memakai Category'
);

select lives_ok(
  format(
    'select public.rpc_update_standalone_transaction(%L, 600000, now(), NULL, %L, %L)',
    :'income_tx', :'cash', :'salary'
  ),
  'TRX-016: nominal Income dapat diubah'
);

select is(public.fund_balance(:'cash'), 1100000::numeric, 'TRX-016: saldo mencerminkan nominal Income terbaru');

select lives_ok(
  format(
    'select public.rpc_update_standalone_transaction(%L, 250000, now(), %L, NULL, %L)',
    :'expense_tx', :'cash', :'food'
  ),
  'TRX-017: nominal Expense dapat diubah'
);

select is(public.fund_balance(:'cash'), 1050000::numeric, 'TRX-017: saldo mencerminkan nominal Expense terbaru');

select lives_ok(
  format(
    'select public.rpc_update_standalone_transaction(%L, 250000, now(), %L, NULL, %L)',
    :'expense_tx', :'other', :'food'
  ),
  'TRX-018: Fund sumber Expense dapat diganti'
);

select is(public.fund_balance(:'cash'), 1300000::numeric, 'TRX-018: Fund lama dipulihkan');
select is(public.fund_balance(:'other'), 250000::numeric, 'TRX-018: Fund baru berkurang');

select lives_ok(
  format(
    'select public.rpc_update_standalone_transaction(%L, 400000, now(), %L, %L, NULL)',
    :'transfer_tx', :'cash', :'savings'
  ),
  'TRX-019: nominal Transfer dapat diubah'
);

select is(public.fund_balance(:'cash'), 1200000::numeric, 'TRX-019: saldo sumber Transfer konsisten');
select is(public.fund_balance(:'savings'), 600000::numeric, 'TRX-019: saldo tujuan Transfer konsisten');

select throws_ok(
  format(
    'select public.rpc_update_standalone_transaction(%L, 250000, now(), %L, NULL, %L)',
    :'expense_tx', :'savings', :'food'
  ),
  'P0001',
  'SOURCE_FUND_NOT_ACTIVE',
  'TRX-043: Expense tidak dapat diubah ke Savings/Goal Fund'
);

select throws_ok(
  format(
    'select public.rpc_update_standalone_transaction(%L, 2000000, now(), %L, %L, NULL)',
    :'transfer_tx', :'cash', :'savings'
  ),
  'P0001',
  'FUND_BALANCE_NEGATIVE',
  'TRX-020/038: perubahan yang membuat saldo negatif ditolak'
);

select throws_ok(
  format(
    'select public.rpc_update_standalone_transaction(%L, 0, now(), NULL, %L, %L)',
    :'income_tx', :'cash', :'salary'
  ),
  'P0001',
  'INVALID_AMOUNT',
  'TRX-021: perubahan nominal menjadi 0 ditolak'
);

select lives_ok(
  format('select public.rpc_delete_standalone_transaction(%L)', :'income_tx'),
  'TRX-025: Income biasa dapat dihapus'
);

select is(public.fund_balance(:'cash'), 600000::numeric, 'TRX-025: saldo berkurang setelah Income dihapus');

select lives_ok(
  format('select public.rpc_delete_standalone_transaction(%L)', :'expense_tx'),
  'TRX-026: Expense biasa dapat dihapus'
);

select is(public.fund_balance(:'other'), 500000::numeric, 'TRX-026: dampak Expense dibalik');

select lives_ok(
  format('select public.rpc_delete_standalone_transaction(%L)', :'transfer_tx'),
  'TRX-027: Transfer biasa dapat dihapus'
);

select is(public.fund_balance(:'cash'), 1000000::numeric, 'TRX-027: saldo sumber Transfer dipulihkan');
select is(public.fund_balance(:'savings'), 200000::numeric, 'TRX-027: saldo tujuan Transfer dipulihkan');

-- Penghapusan Income yang membuat saldo negatif.
select public.test_create_fund('Negative Test', 100, 'active') as negative_fund \gset
select public.test_income(100, now(), :'negative_fund', :'salary') as negative_income \gset
select public.test_expense(200, now(), :'negative_fund', :'food') as negative_expense \gset

select throws_ok(
  format('select public.rpc_delete_standalone_transaction(%L)', :'negative_income'),
  'P0001',
  'FUND_BALANCE_NEGATIVE',
  'TRX-037: penghapusan Income yang membuat saldo negatif ditolak'
);

select is(public.fund_balance(:'negative_fund'), 0::numeric, 'TRX-037: saldo tetap setelah penghapusan ditolak');

-- Transaksi Pocket harus dikelola lewat RPC Pocket.
select public.test_create_pocket('Income Pocket', 'income') as income_pocket \gset
select public.test_create_income_item(:'income_pocket', 'Gaji', 100000) as income_item \gset

select public.test_confirm_income_item(:'income_item', :'cash') as pocket_income_tx \gset

select public.test_income(1000, now() - interval '1 day', :'cash', :'salary') as older_tx \gset
select public.test_income(1000, now() + interval '1 day', :'cash', :'salary') as newest_tx \gset

select throws_ok(
  format(
    'select public.rpc_update_standalone_transaction(%L, 1000, now(), NULL, %L, %L)',
    :'pocket_income_tx', :'cash', :'salary'
  ),
  'P0001',
  'TRANSACTION_MANAGED_BY_POCKET',
  'TRX-022: transaksi Pocket tidak dapat diubah dari History'
);

select throws_ok(
  format('select public.rpc_delete_standalone_transaction(%L)', :'pocket_income_tx'),
  'P0001',
  'TRANSACTION_MANAGED_BY_POCKET',
  'TRX-028: transaksi Pocket tidak dapat dihapus dari History'
);

select public.test_set_claims(:'bob');

select throws_ok(
  format(
    'select public.rpc_update_standalone_transaction(%L, 1, now(), NULL, %L, %L)',
    :'pocket_income_tx', :'cash', :'salary'
  ),
  'P0001',
  'TRANSACTION_NOT_FOUND',
  'AUTH-003: pengguna lain tidak dapat mengubah transaksi orang lain'
);

select public.test_set_claims(:'alice');

select is(
  (
    select count(*)
    from public.transactions
    where user_id = :'alice' and type = 'income'
  ),
  4::bigint,
  'HIST-003: filter Income mengembalikan transaksi Income milik pengguna'
);

select is(
  (
    select id
    from public.transactions
    where user_id = :'alice'
    order by occurred_at desc, created_at desc
    limit 1
  ),
  :'newest_tx'::uuid,
  'HIST-002: transaksi terbaru tampil lebih dahulu'
);

reset role;

select * from finish();
rollback;
