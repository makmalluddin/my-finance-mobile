begin;

\ir helpers.inc

select no_plan();

select public.test_create_user('alice-dash@example.com') as alice \gset
select public.test_create_user('bob-dash@example.com') as bob \gset

set local role authenticated;
select public.test_set_claims(:'alice');

select public.test_create_fund('Cash', 5000000, 'active') as cash \gset
select public.test_create_fund('Savings', 500000, 'savings_goal') as savings \gset
select public.test_create_fund('Archived', 0, 'active') as archived_fund \gset

select public.rpc_archive_fund(:'archived_fund');

select public.test_category('income', 'Salary') as salary \gset
select public.test_category('income', 'Other Income') as other_income \gset
select public.test_category('expense', 'Food') as food \gset

-- Transaksi aktual pada tanggal-tanggal tertentu.
select public.test_income(1000000, '2026-03-05 12:00:00+00', :'cash', :'salary') as income1 \gset
select public.test_income(200000, '2026-03-07 12:00:00+00', :'cash', :'other_income') as income2 \gset
select public.test_expense(100000, '2026-03-10 12:00:00+00', :'cash', :'food') as expense1 \gset
select public.test_expense(25000, '2026-03-04 12:00:00+00', :'cash', :'food') as expense2 \gset
select public.test_expense(40000, '2026-03-03 12:00:00+00', :'cash', :'food') as expense3 \gset
select public.test_expense(20000, '2026-03-09 20:00:00+00', :'cash', :'food') as expense4 \gset
select public.test_expense(30000, '2026-03-10 23:00:00+00', :'cash', :'food') as expense5 \gset
select public.test_transfer(50000, '2026-03-06 12:00:00+00', :'cash', :'savings') as transfer1 \gset

-- Planned Expense dan template Automation tidak boleh dihitung sebagai
-- Expense aktual maupun sebagai aset Pocket.
select public.test_create_pocket('Planned Pocket', 'expense') as planned_pocket \gset
select public.test_create_planned_item(:'planned_pocket', 'Planned Item', 150000) as planned_item \gset

select public.test_create_pocket('Automation Pocket', 'expense') as automation_pocket \gset
select public.test_create_automation(
  :'automation_pocket', 'Template Only', 300000, :'cash', 'monthly',
  '2026-04-01', 'UTC'
) as template_auto \gset

select is(public.fund_balance(:'cash'), 5935000::numeric, 'DASH-012: saldo Fund dihitung dari transaksi aktual');

select public.rpc_get_dashboard('2026-03-10', 'UTC') as dash \gset

select is(
  ((:'dash'::json)->>'total_active_funds_balance')::numeric,
  5935000::numeric,
  'DASH-001: total saldo Active Fund dihitung'
);

select is(
  ((:'dash'::json)->>'outstanding_expense_allocation')::numeric,
  150000::numeric,
  'DASH-002: alokasi Planned Expense dihitung'
);

select is(
  ((:'dash'::json)->>'active_balance')::numeric,
  5785000::numeric,
  'DASH-002: Active Balance dikurangi alokasi Planned Expense'
);

select is(
  json_array_length((:'dash'::json)->'active_funds'),
  1,
  'DASH-001: hanya Active Fund yang masuk daftar'
);

select is(
  ((:'dash'::json)->'active_funds'->0->>'name'),
  'Cash'::text,
  'DASH-001: Active Fund yang tampil adalah Fund aktif'
);

select is(
  ((:'dash'::json)->'active_funds'->0->>'balance')::numeric,
  5935000::numeric,
  'DASH-012: saldo Active Fund pada daftar sesuai perhitungan'
);

select is(
  ((:'dash'::json)->>'pending_notifications')::integer,
  0,
  'AUTO-024: belum ada Notification pending pada Dashboard'
);

select is(
  json_array_length((:'dash'::json)->'expense_series'),
  7,
  'DASH-007: grafik Expense berisi tujuh hari'
);

select is(
  (
    select array_agg(e->>'date' order by e->>'date')
    from json_array_elements((:'dash'::json)->'expense_series') e
  ),
  array[
    '2026-03-04', '2026-03-05', '2026-03-06',
    '2026-03-07', '2026-03-08', '2026-03-09', '2026-03-10'
  ]::text[],
  'DASH-007: grafik memakai rentang tujuh hari kalender'
);

select is(
  (
    select (e->>'total')::numeric
    from json_array_elements((:'dash'::json)->'expense_series') e
    where e->>'date' = '2026-03-04'
  ),
  25000::numeric,
  'DASH-007: Expense pada hari pertama rentang terhitung'
);

select is(
  (
    select (e->>'total')::numeric
    from json_array_elements((:'dash'::json)->'expense_series') e
    where e->>'date' = '2026-03-10'
  ),
  130000::numeric,
  'DASH-007: Expense pada hari ini dijumlahkan'
);

select is(
  (
    select (e->>'total')::numeric
    from json_array_elements((:'dash'::json)->'expense_series') e
    where e->>'date' = '2026-03-05'
  ),
  0::numeric,
  'DASH-008: Income tidak masuk grafik Expense'
);

select is(
  (
    select (e->>'total')::numeric
    from json_array_elements((:'dash'::json)->'expense_series') e
    where e->>'date' = '2026-03-06'
  ),
  0::numeric,
  'DASH-009: Transfer tidak masuk grafik Expense'
);

select is(
  (
    select (e->>'total')::numeric
    from json_array_elements((:'dash'::json)->'expense_series') e
    where e->>'date' = '2026-03-03'
  ),
  null::numeric,
  'DASH-007: Expense di luar rentang tidak masuk grafik'
);

select is(
  (
    select sum((e->>'total')::numeric)
    from json_array_elements((:'dash'::json)->'expense_series') e
  ),
  175000::numeric,
  'DASH-010: Planned Expense dan template tidak masuk grafik'
);

select public.rpc_get_dashboard('2026-03-10', 'Asia/Jakarta') as dash_jkt \gset

select is(
  (
    select (e->>'total')::numeric
    from json_array_elements((:'dash_jkt'::json)->'expense_series') e
    where e->>'date' = '2026-03-10'
  ),
  120000::numeric,
  'DASH-013: bucket grafik memakai tanggal lokal timezone'
);

select is(
  (
    select (e->>'total')::numeric
    from json_array_elements((:'dash_jkt'::json)->'expense_series') e
    where e->>'date' = '2026-03-09'
  ),
  0::numeric,
  'DASH-013: transaksi malam UTC bergeser ke hari lokal berikutnya'
);

-- ---------------------------------------------------------------------------
-- DASH-011: Dashboard mengikuti perubahan transaksi
-- ---------------------------------------------------------------------------

select lives_ok(
  format(
    'select public.rpc_update_standalone_transaction(%L, 200000, %L, %L, NULL, %L)',
    :'expense1', '2026-03-10 12:00:00+00', :'cash', :'food'
  ),
  'DASH-011: Expense aktual dapat diubah'
);

select public.rpc_get_dashboard('2026-03-10', 'UTC') as dash_after_update \gset

select is(
  ((:'dash_after_update'::json)->>'total_active_funds_balance')::numeric,
  5835000::numeric,
  'DASH-011: total saldo Active Fund mengikuti nominal terbaru'
);

select is(
  ((:'dash_after_update'::json)->>'active_balance')::numeric,
  5685000::numeric,
  'DASH-011: Active Balance mengikuti nominal terbaru'
);

select is(
  (
    select (e->>'total')::numeric
    from json_array_elements((:'dash_after_update'::json)->'expense_series') e
    where e->>'date' = '2026-03-10'
  ),
  230000::numeric,
  'DASH-011: grafik Expense mengikuti nominal terbaru'
);

select lives_ok(
  format('select public.rpc_delete_standalone_transaction(%L)', :'expense2'),
  'DASH-011: Expense aktual dapat dihapus'
);

select public.rpc_get_dashboard('2026-03-10', 'UTC') as dash_after_delete \gset

select is(
  ((:'dash_after_delete'::json)->>'total_active_funds_balance')::numeric,
  5860000::numeric,
  'DASH-011: total saldo Active Fund mengikuti penghapusan'
);

select is(
  (
    select (e->>'total')::numeric
    from json_array_elements((:'dash_after_delete'::json)->'expense_series') e
    where e->>'date' = '2026-03-04'
  ),
  0::numeric,
  'DASH-011: grafik Expense mengikuti penghapusan'
);

-- DASH-006: Transfer dari Savings/Goal ke Active Fund.
select lives_ok(
  format(
    'select public.rpc_create_transfer(25000, %L, %L, %L)',
    '2026-03-10 13:00:00+00', :'savings', :'cash'
  ),
  'DASH-006: Transfer Savings/Goal ke Active Fund berhasil'
);

select public.rpc_get_dashboard('2026-03-10', 'UTC') as dash_after_transfer_in \gset

select is(
  ((:'dash_after_transfer_in'::json)->>'total_active_funds_balance')::numeric,
  5885000::numeric,
  'DASH-006: Active Balance bertambah sesuai Transfer masuk'
);

select is(public.fund_balance(:'savings'), 525000::numeric, 'DASH-006: saldo Savings/Goal berkurang');

-- DASH-004: konversi Planned Expense tidak mengubah Active Balance.
select lives_ok(
  format('select public.rpc_convert_planned_expense(%L, %L)', :'planned_item', :'cash'),
  'DASH-004: Planned Expense dapat dikonversi'
);

select public.rpc_get_dashboard('2026-03-10', 'UTC') as dash_after_convert \gset

select is(
  ((:'dash_after_convert'::json)->>'outstanding_expense_allocation')::numeric,
  0::numeric,
  'DASH-004: alokasi dilepaskan setelah konversi'
);

select is(
  ((:'dash_after_convert'::json)->>'total_active_funds_balance')::numeric,
  5735000::numeric,
  'DASH-004: saldo Active Fund berkurang setelah konversi'
);

select is(
  ((:'dash_after_convert'::json)->>'active_balance')::numeric,
  5735000::numeric,
  'DASH-004: Active Balance tetap sama setelah konversi'
);

select public.test_create_planned_item(:'planned_pocket', 'New Planned', 75000) as new_planned \gset

select public.rpc_get_dashboard('2026-03-10', 'UTC') as dash_after_planned \gset

select is(
  ((:'dash_after_planned'::json)->>'outstanding_expense_allocation')::numeric,
  75000::numeric,
  'DASH-002: alokasi Planned Expense baru dihitung'
);

select is(
  ((:'dash_after_planned'::json)->>'active_balance')::numeric,
  5660000::numeric,
  'DASH-002: Active Balance berkurang oleh alokasi baru'
);

-- ---------------------------------------------------------------------------
-- Notification pending dan validasi parameter
-- ---------------------------------------------------------------------------

select public.test_create_pocket('Income Pocket', 'income') as income_pocket \gset
select public.test_create_automation(
  :'income_pocket', 'Salary Automation', 100000, :'cash', 'weekly',
  '2026-03-01', 'UTC'
) as salary_auto \gset

select public.rpc_process_due_automations('2026-03-01 00:00:00+00') as process_result \gset

select is(
  (:'process_result'::json)->>'created_occurrences',
  '1',
  'AUTO-010: occurrence Automation dibuat untuk Dashboard'
);

select public.rpc_get_dashboard('2026-03-10', 'UTC') as dash_notif \gset

select is(
  ((:'dash_notif'::json)->>'pending_notifications')::integer,
  1,
  'AUTO-024: Dashboard menghitung Notification pending'
);

select lives_ok(
  format(
    'select public.rpc_reject_occurrence((select id from public.automation_occurrences where automation_id = %L limit 1))',
    :'salary_auto'
  ),
  'AUTO-027: Notification pending dapat diselesaikan'
);

select public.rpc_get_dashboard('2026-03-10', 'UTC') as dash_no_notif \gset

select is(
  ((:'dash_no_notif'::json)->>'pending_notifications')::integer,
  0,
  'AUTO-027: Notification pending berkurang setelah reject'
);

select throws_ok(
  $$ select public.rpc_get_dashboard(NULL, 'UTC') $$,
  'P0001',
  'VALIDATION_ERROR',
  'DASH: tanggal Dashboard kosong ditolak'
);

select throws_ok(
  $$ select public.rpc_get_dashboard('2026-03-10', 'Mars/Olympus') $$,
  'P0001',
  'VALIDATION_ERROR',
  'DASH: timezone Dashboard tidak valid ditolak'
);

-- ---------------------------------------------------------------------------
-- AUTH-003: Dashboard hanya menampilkan data milik pengguna
-- ---------------------------------------------------------------------------

select public.test_set_claims(:'bob');

select public.test_create_fund('Bob Cash', 100000, 'active') as bob_cash \gset

select public.rpc_get_dashboard('2026-03-10', 'UTC') as bob_dash \gset

select is(
  ((:'bob_dash'::json)->>'total_active_funds_balance')::numeric,
  100000::numeric,
  'AUTH-003: Dashboard hanya menghitung Fund milik pengguna'
);

select is(
  json_array_length((:'bob_dash'::json)->'active_funds'),
  1,
  'AUTH-003: daftar Active Fund pengguna lain tidak terlihat'
);

select is(
  ((:'bob_dash'::json)->'active_funds'->0->>'name'),
  'Bob Cash'::text,
  'AUTH-003: Active Fund yang tampil milik pengguna sendiri'
);

select is(
  ((:'bob_dash'::json)->>'outstanding_expense_allocation')::numeric,
  0::numeric,
  'AUTH-003: alokasi milik pengguna lain tidak terlihat'
);

reset role;

select * from finish();
rollback;
