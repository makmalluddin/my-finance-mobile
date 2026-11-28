begin;

\ir helpers.inc

select no_plan();

select public.test_create_user('alice-pockets@example.com') as alice \gset
select public.test_create_user('bob-pockets@example.com') as bob \gset

set local role authenticated;
select public.test_set_claims(:'alice');

select public.test_create_fund('Cash', 1000000, 'active') as cash \gset
select public.test_create_fund('Savings', 200000, 'savings_goal') as savings \gset
select public.test_create_fund('Other', 500000, 'active') as other \gset

-- ---------------------------------------------------------------------------
-- Pocket CRUD dan aturan tipe
-- ---------------------------------------------------------------------------

select public.test_create_pocket('Income Pocket', 'income') as income_pocket \gset
select public.test_create_pocket('Expense Pocket', 'expense') as expense_pocket \gset
select public.test_create_pocket('Transfer Pocket', 'transfer') as transfer_pocket \gset

select is(
  (select type from public.pockets where id = :'income_pocket'),
  'income'::text,
  'PCK-001: Pocket Income dapat dibuat'
);

select is(
  (select type from public.pockets where id = :'expense_pocket'),
  'expense'::text,
  'PCK-002: Pocket Expense dapat dibuat'
);

select is(
  (select type from public.pockets where id = :'transfer_pocket'),
  'transfer'::text,
  'PCK-003: Pocket Transfer dapat dibuat'
);

select lives_ok(
  format(
    'select public.rpc_create_pocket(%L, %L, %L)',
    'Described', 'Deskripsi', 'expense'
  ),
  'PCK-004: Pocket dengan deskripsi dapat dibuat'
);

select throws_ok(
  $$ select public.rpc_create_pocket('', null, 'income') $$,
  'P0001',
  'VALIDATION_ERROR',
  'PCK-006: Pocket dengan nama kosong ditolak'
);

select throws_ok(
  $$ select public.rpc_create_pocket('Bad', null, 'wallet') $$,
  'P0001',
  'INVALID_POCKET_TYPE',
  'PCK: tipe Pocket tidak valid ditolak'
);

select public.test_create_pocket('Mutable Pocket', 'income') as mutable_pocket \gset

select lives_ok(
  format(
    'select public.rpc_update_pocket(%L, %L, NULL, %L)',
    :'mutable_pocket', 'Mutable Pocket', 'expense'
  ),
  'PCK-007: tipe Pocket dapat diubah sebelum memiliki item'
);

select public.test_create_pocket('Locked Pocket', 'income') as locked_pocket \gset
select public.test_create_income_item(:'locked_pocket', 'First Item', 10000) as locked_item \gset

select throws_ok(
  format(
    'select public.rpc_update_pocket(%L, %L, NULL, %L)',
    :'locked_pocket', 'Locked Pocket', 'expense'
  ),
  'P0001',
  'POCKET_TYPE_IMMUTABLE',
  'PCK-008: tipe Pocket tidak dapat diubah setelah memiliki item'
);

select lives_ok(
  format('select public.rpc_delete_pocket_item(%L)', :'locked_item'),
  'PCK-037: Income Item pending dapat dihapus'
);

select throws_ok(
  format(
    'select public.rpc_update_pocket(%L, %L, NULL, %L)',
    :'locked_pocket', 'Locked Pocket', 'expense'
  ),
  'P0001',
  'POCKET_TYPE_IMMUTABLE',
  'PCK-008: tipe tetap tidak dapat diubah setelah item pernah ada'
);

select lives_ok(
  format('select public.rpc_archive_pocket(%L)', :'income_pocket'),
  'PCK-009: Pocket dapat diarsipkan'
);

select throws_ok(
  format(
    'select public.rpc_create_income_item(%L, %L, 1000)',
    :'income_pocket', 'Archived Item'
  ),
  'P0001',
  'POCKET_ARCHIVED',
  'PCK-010: item baru tidak dapat ditambahkan ke Pocket archived'
);

select lives_ok(
  format('select public.rpc_unarchive_pocket(%L)', :'income_pocket'),
  'PCK-011: Pocket archived dapat diaktifkan kembali'
);

-- ---------------------------------------------------------------------------
-- Income Pocket
-- ---------------------------------------------------------------------------

select public.test_create_income_item(:'income_pocket', 'Salary Item', 100000) as income_item1 \gset

select is(
  (select status from public.pocket_items where id = :'income_item1'),
  'pending'::text,
  'PCK-012: Income Item baru berstatus pending'
);

select is(
  (select count(*) from public.transactions where user_id = :'alice'),
  0::bigint,
  'PCK-012: Income Item pending belum menghasilkan transaksi'
);

select lives_ok(
  format('select public.rpc_archive_pocket(%L)', :'income_pocket'),
  'PCK-040: Pocket dengan item pending dapat diarsipkan'
);

select public.test_confirm_income_item(:'income_item1', :'cash') as income_tx1 \gset

select is(public.fund_balance(:'cash'), 1100000::numeric, 'PCK-013: saldo Fund tujuan bertambah setelah konfirmasi');
select is(
  (select status from public.pocket_items where id = :'income_item1'),
  'confirmed'::text,
  'PCK-013: Income Item menjadi confirmed'
);

select throws_ok(
  format('select public.rpc_delete_pocket_item(%L)', :'income_item1'),
  'P0001',
  'POCKET_ITEM_STATUS_INVALID',
  'PCK-038: Income Item confirmed tidak dapat dihapus langsung'
);

select lives_ok(
  format(
    'select public.rpc_update_pocket_transaction(%L, 120000, now(), NULL, %L)',
    :'income_tx1', :'cash'
  ),
  'TRX-023/040: nominal Income Pocket dapat diubah'
);

select is(
  (select amount from public.pocket_items where id = :'income_item1'),
  120000::numeric,
  'TRX-040: nominal Pocket Item Income ikut diperbarui'
);

select is(public.fund_balance(:'cash'), 1120000::numeric, 'TRX-023: saldo Fund mencerminkan nominal baru');

select lives_ok(
  format('select public.rpc_delete_pocket_transaction(%L)', :'income_tx1'),
  'TRX-029/033: Income Pocket Transaction dapat dihapus'
);

select is(
  (select status from public.pocket_items where id = :'income_item1'),
  'pending'::text,
  'TRX-033: Income Item kembali pending setelah transaksi dihapus'
);

select is(public.fund_balance(:'cash'), 1000000::numeric, 'TRX-033: saldo Fund tujuan dipulihkan');

select lives_ok(
  format('select public.rpc_unarchive_pocket(%L)', :'income_pocket'),
  'PCK-040: Pocket archived dapat diaktifkan kembali untuk item baru'
);

select public.test_create_income_item(:'income_pocket', 'Salary Item', 100000) as income_item1b \gset
select public.test_confirm_income_item(:'income_item1b', :'cash') as income_tx1b \gset
select public.test_create_income_item(:'income_pocket', 'Savings Item', 50000) as income_item2 \gset
select public.test_confirm_income_item(:'income_item2', :'savings') as income_tx2 \gset

select is(public.fund_balance(:'savings'), 250000::numeric, 'PCK-015: Income Item dapat dikonfirmasi ke Fund berbeda');

select lives_ok(
  format('select public.rpc_delete_pocket(%L)', :'income_pocket'),
  'PCK-034: Pocket dengan transaksi aktual dapat dihapus'
);

select is(
  (select pocket_item_id from public.transactions where id = :'income_tx1b'),
  null::uuid,
  'PCK-034/036: transaksi Income dipertahankan tanpa Pocket Item'
);

select is(
  (select category_id from public.transactions where id = :'income_tx1b'),
  public.test_category('income', 'Other Income'),
  'PCK-034: transaksi Income mendapat Category Other Income'
);

select is(
  (select category_id from public.transactions where id = :'income_tx2'),
  public.test_category('income', 'Other Income'),
  'PCK-034: transaksi Income kedua juga mendapat Category Other Income'
);

select is(public.fund_balance(:'cash'), 1100000::numeric, 'PCK-034: saldo tidak berubah akibat penghapusan Pocket');
select is(public.fund_balance(:'savings'), 250000::numeric, 'PCK-034: saldo Fund Savings tetap');

-- ---------------------------------------------------------------------------
-- Expense Pocket
-- ---------------------------------------------------------------------------

select public.test_create_planned_item(:'expense_pocket', 'Planned 1', 200000) as planned1 \gset

select is(
  (select total from public.v_outstanding_expense_allocation where user_id = :'alice'),
  200000::numeric,
  'PCK-016: Planned Expense masuk alokasi'
);

select lives_ok(
  format(
    'select public.rpc_update_planned_expense_item(%L, %L, 250000)',
    :'planned1', 'Planned 1 Updated'
  ),
  'PCK-018: Planned Expense dapat diubah'
);

select is(
  (select total from public.v_outstanding_expense_allocation where user_id = :'alice'),
  250000::numeric,
  'PCK-018: alokasi dihitung ulang'
);

select lives_ok(
  format('select public.rpc_delete_pocket_item(%L)', :'planned1'),
  'PCK-019: Planned Expense dapat dihapus'
);

select is(
  coalesce(
    (select total from public.v_outstanding_expense_allocation where user_id = :'alice'),
    0
  ),
  0::numeric,
  'PCK-019: alokasi dilepaskan setelah item dihapus'
);

select public.test_create_planned_item(:'expense_pocket', 'Planned 2', 300000) as planned2 \gset
select public.test_convert_planned_expense(:'planned2', :'cash') as expense_tx1 \gset

select is(public.fund_balance(:'cash'), 800000::numeric, 'PCK-020: saldo Fund sumber berkurang setelah konversi');
select is(
  (select status from public.pocket_items where id = :'planned2'),
  'converted'::text,
  'PCK-020: item menjadi converted'
);
select is(
  coalesce(
    (select total from public.v_outstanding_expense_allocation where user_id = :'alice'),
    0
  ),
  0::numeric,
  'PCK-020: alokasi dilepaskan setelah konversi'
);

select throws_ok(
  format('select public.rpc_convert_planned_expense(%L, %L)', :'planned2', :'cash'),
  'P0001',
  'POCKET_ITEM_NOT_PLANNED',
  'PCK-023: konversi kedua ditolak'
);

select throws_ok(
  format(
    'select public.rpc_update_planned_expense_item(%L, %L, 300000)',
    :'planned2', 'Cannot Edit'
  ),
  'P0001',
  'POCKET_ITEM_NOT_PLANNED',
  'PCK-024: item converted tidak dapat diubah'
);

select throws_ok(
  format(
    'select public.rpc_update_pocket_transaction(%L, 310000, now(), %L, NULL)',
    :'expense_tx1', :'cash'
  ),
  'P0001',
  'AMOUNT_IMMUTABLE',
  'TRX-036: nominal Expense hasil konversi tidak dapat diubah'
);

select lives_ok(
  format('select public.rpc_delete_pocket_transaction(%L)', :'expense_tx1'),
  'TRX-034: Expense hasil konversi dapat dihapus'
);

select is(
  (select status from public.pocket_items where id = :'planned2'),
  'planned'::text,
  'TRX-034: item kembali planned'
);
select is(public.fund_balance(:'cash'), 1100000::numeric, 'TRX-034: saldo Fund sumber dipulihkan');
select is(
  (select total from public.v_outstanding_expense_allocation where user_id = :'alice'),
  300000::numeric,
  'TRX-034: alokasi kembali dihitung'
);

select throws_ok(
  format('select public.rpc_convert_planned_expense(%L, %L)', :'planned2', :'savings'),
  'P0001',
  'SOURCE_FUND_NOT_ACTIVE',
  'PCK-039: konversi dari Savings/Goal Fund ditolak'
);

select public.test_convert_planned_expense(:'planned2', :'cash') as expense_tx2 \gset

select public.test_create_planned_item(:'expense_pocket', 'Too Large', 10000000) as too_large \gset

select throws_ok(
  format('select public.rpc_convert_planned_expense(%L, %L)', :'too_large', :'cash'),
  'P0001',
  'INSUFFICIENT_BALANCE',
  'PCK-021: konversi dengan saldo tidak mencukupi ditolak'
);

select is(
  (select status from public.pocket_items where id = :'too_large'),
  'planned'::text,
  'PCK-021: item tetap planned setelah konversi ditolak'
);

select lives_ok(
  format('select public.rpc_delete_pocket_item(%L)', :'too_large'),
  'PCK-019: Planned Expense yang terlalu besar dapat dihapus'
);

select public.test_create_pocket('Expense Pocket 2', 'expense') as expense_pocket2 \gset
select public.test_create_planned_item(:'expense_pocket2', 'Planned 3', 400000) as planned3 \gset

select is(
  (select total from public.v_outstanding_expense_allocation where user_id = :'alice'),
  400000::numeric,
  'PCK-035: alokasi Planned Expense terhitung'
);

select lives_ok(
  format('select public.rpc_delete_pocket(%L)', :'expense_pocket2'),
  'PCK-035: Pocket dengan Planned Expense dapat dihapus'
);

select is(
  coalesce(
    (select total from public.v_outstanding_expense_allocation where user_id = :'alice'),
    0
  ),
  0::numeric,
  'PCK-035: alokasi dilepaskan setelah Pocket dihapus'
);

select lives_ok(
  format('select public.rpc_delete_pocket(%L)', :'expense_pocket'),
  'PCK-034: Pocket dengan Expense aktual dapat dihapus'
);

select is(
  (select pocket_item_id from public.transactions where id = :'expense_tx2'),
  null::uuid,
  'PCK-034: transaksi Expense dipertahankan tanpa Pocket Item'
);

select is(
  (select category_id from public.transactions where id = :'expense_tx2'),
  public.test_category('expense', 'Other'),
  'PCK-034: transaksi Expense mendapat Category Other'
);

select is(public.fund_balance(:'cash'), 800000::numeric, 'PCK-034: saldo tidak berubah akibat penghapusan Pocket');

-- ---------------------------------------------------------------------------
-- Transfer Pocket
-- ---------------------------------------------------------------------------

select public.test_transfer_item(:'transfer_pocket', 'Transfer 1', 100000, :'cash', :'savings', now()) as transfer_item1 \gset

select is(public.fund_balance(:'cash'), 700000::numeric, 'PCK-026: saldo Fund sumber Transfer berkurang');
select is(public.fund_balance(:'savings'), 350000::numeric, 'PCK-026: saldo Fund tujuan Transfer bertambah');
select is(
  (select status from public.pocket_items where id = :'transfer_item1'),
  'completed'::text,
  'PCK-026: Transfer Item berstatus completed'
);

select is(
  (select incoming from public.v_pocket_transfer_summary where pocket_id = :'transfer_pocket'),
  100000::numeric,
  'PCK-028: incoming Transfer terhitung'
);

select is(
  (select outgoing from public.v_pocket_transfer_summary where pocket_id = :'transfer_pocket'),
  100000::numeric,
  'PCK-029: outgoing Transfer terhitung'
);

select is(
  (select net from public.v_pocket_transfer_summary where pocket_id = :'transfer_pocket'),
  0::numeric,
  'PCK-030: net Transfer adalah selisih incoming dan outgoing'
);

select is(
  (select item_count from public.v_pocket_transfer_summary where pocket_id = :'transfer_pocket'),
  1,
  'PCK-028/029: jumlah item Transfer terhitung'
);

select throws_ok(
  format(
    'select public.rpc_create_transfer_item(%L, %L, 10000000, %L, %L, now())',
    :'transfer_pocket', 'Too Big', :'cash', :'savings'
  ),
  'P0001',
  'INSUFFICIENT_BALANCE',
  'PCK-027: Transfer dengan saldo tidak mencukupi ditolak'
);

select is(
  (select count(*) from public.pocket_items where pocket_id = :'transfer_pocket'),
  1::bigint,
  'PCK-027: Transfer gagal tidak membuat item'
);

-- Ambil transaksi transfer pertama untuk update.
select id as transfer_tx1
from public.transactions
where pocket_item_id = :'transfer_item1'
\gset

select lives_ok(
  format(
    'select public.rpc_update_pocket_transaction(%L, 150000, now(), %L, %L)',
    :'transfer_tx1', :'cash', :'savings'
  ),
  'TRX-023: nominal Transfer Pocket dapat diubah'
);

select is(
  (select amount from public.pocket_items where id = :'transfer_item1'),
  150000::numeric,
  'TRX-040: nominal Pocket Item Transfer ikut diperbarui'
);

select is(public.fund_balance(:'cash'), 650000::numeric, 'TRX-023: saldo sumber Transfer konsisten');
select is(public.fund_balance(:'savings'), 400000::numeric, 'TRX-023: saldo tujuan Transfer konsisten');

select public.test_transfer_item(:'transfer_pocket', 'Transfer 2', 50000, :'cash', :'other', now()) as transfer_item2 \gset

select is(
  (select item_count from public.v_pocket_transfer_summary where pocket_id = :'transfer_pocket'),
  2,
  'PCK-032: beberapa Transfer Item terhitung'
);

select is(
  (select incoming from public.v_pocket_transfer_summary where pocket_id = :'transfer_pocket'),
  200000::numeric,
  'PCK-028: incoming menjumlahkan seluruh Transfer Item'
);

select lives_ok(
  format('select public.rpc_delete_pocket_transaction(%L)', :'transfer_tx1'),
  'PCK-031: Transfer Item dapat dihapus melalui transaksinya'
);

select is(
  (select count(*) from public.pocket_items where id = :'transfer_item1'),
  0::bigint,
  'PCK-031: Pocket Item Transfer ikut terhapus'
);

select is(
  (select count(*) from public.pocket_items where id = :'transfer_item2'),
  1::bigint,
  'PCK-032: Transfer Item lain tidak terpengaruh'
);

select is(public.fund_balance(:'cash'), 750000::numeric, 'PCK-031: saldo Fund sumber dipulihkan');
select is(public.fund_balance(:'savings'), 250000::numeric, 'PCK-031: saldo Fund tujuan dipulihkan');

select id as transfer_tx2
from public.transactions
where pocket_item_id = :'transfer_item2'
\gset

select lives_ok(
  format('select public.rpc_delete_pocket(%L)', :'transfer_pocket'),
  'PCK-034: Pocket Transfer dapat dihapus'
);

select is(
  (select pocket_item_id from public.transactions where id = :'transfer_tx2'),
  null::uuid,
  'PCK-034: transaksi Transfer dipertahankan tanpa Pocket Item'
);

select is(
  (select category_id from public.transactions where id = :'transfer_tx2'),
  null::uuid,
  'PCK-034: transaksi Transfer tetap tanpa Category'
);

select is(public.fund_balance(:'cash'), 750000::numeric, 'PCK-034: saldo Cash tidak berubah');
select is(public.fund_balance(:'other'), 550000::numeric, 'PCK-034: saldo Other tidak berubah');

-- ---------------------------------------------------------------------------
-- Akses lintas pengguna
-- ---------------------------------------------------------------------------

select public.test_set_claims(:'bob');

select throws_ok(
  format('select public.rpc_delete_pocket(%L)', :'locked_pocket'),
  'P0001',
  'POCKET_NOT_FOUND',
  'AUTH-003: pengguna lain tidak dapat menghapus Pocket orang lain'
);

select throws_ok(
  format('select public.rpc_delete_pocket_transaction(%L)', :'transfer_tx2'),
  'P0001',
  'TRANSACTION_NOT_FOUND',
  'AUTH-003: pengguna lain tidak dapat menghapus transaksi orang lain'
);

reset role;

select * from finish();
rollback;
