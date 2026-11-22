begin;

\ir helpers.inc

select no_plan();

select public.test_create_user('alice-auto@example.com') as alice \gset
select public.test_create_user('bob-auto@example.com') as bob \gset

set local role authenticated;
select public.test_set_claims(:'alice');

select public.test_create_fund('Cash', 10000000, 'active') as cash \gset
select public.test_create_fund('Other', 5000000, 'active') as other \gset
select public.test_create_fund('Savings', 1000000, 'savings_goal') as savings \gset
select public.test_create_fund('Archived', 0, 'active') as archived_fund \gset

select public.rpc_archive_fund(:'archived_fund');

select public.test_create_pocket('Income Pocket', 'income') as income_pocket \gset
select public.test_create_pocket('Expense Pocket', 'expense') as expense_pocket \gset
select public.test_create_pocket('Transfer Pocket', 'transfer') as transfer_pocket \gset

-- ---------------------------------------------------------------------------
-- AUTO-001/002: pembuatan Automation Income dan Expense
-- ---------------------------------------------------------------------------

select public.test_create_automation(
  :'income_pocket', 'Salary Automation', 5000000, :'cash', 'weekly',
  '2026-01-01', 'UTC'
) as income_auto \gset

select pocket_item_id as income_template
from public.automations
where id = :'income_auto'
\gset

select is(
  (select status from public.pocket_items where id = :'income_template'),
  'template'::text,
  'AUTO-001: Income Automation membuat Pocket Item template'
);

select is(
  (select fund_id from public.pocket_items where id = :'income_template'),
  :'cash'::uuid,
  'AUTO-001: Fund default template Income Automation tersimpan'
);

select is(
  (select amount from public.pocket_items where id = :'income_template'),
  5000000::numeric,
  'AUTO-001: nominal template Income Automation tersimpan'
);

select is(
  (select frequency from public.automations where id = :'income_auto'),
  'weekly'::text,
  'AUTO-001: frekuensi Automation tersimpan'
);

select is(
  (select timezone from public.automations where id = :'income_auto'),
  'UTC'::text,
  'AUTO-009: timezone Automation tersimpan saat dibuat'
);

select is(
  (select next_run_at from public.automations where id = :'income_auto'),
  '2026-01-01 00:00:00+00'::timestamptz,
  'AUTO-001: jadwal pertama jatuh tempo pada 00.00 lokal'
);

select is(
  (select is_active from public.automations where id = :'income_auto'),
  true,
  'AUTO-001: Automation baru aktif'
);

select is(
  coalesce(
    (select total from public.v_outstanding_expense_allocation where user_id = :'alice'),
    0
  ),
  0::numeric,
  'AUTO-034: template Income Automation tidak dihitung alokasi'
);

select public.test_create_automation(
  :'expense_pocket', 'Rent Automation', 1000000, :'cash', 'monthly',
  '2026-01-31', 'UTC'
) as expense_auto \gset

select pocket_item_id as expense_template
from public.automations
where id = :'expense_auto'
\gset

select is(
  (select status from public.pocket_items where id = :'expense_template'),
  'template'::text,
  'AUTO-002: Expense Automation membuat Pocket Item template'
);

select is(
  (select next_run_at from public.automations where id = :'expense_auto'),
  '2026-01-31 00:00:00+00'::timestamptz,
  'AUTO-002: jadwal bulanan pertama tersimpan'
);

select is(
  coalesce(
    (select total from public.v_outstanding_expense_allocation where user_id = :'alice'),
    0
  ),
  0::numeric,
  'DASH-003: template Expense Automation tidak dihitung alokasi'
);

-- ---------------------------------------------------------------------------
-- Validasi pembuatan Automation
-- ---------------------------------------------------------------------------

select throws_ok(
  format(
    'select public.rpc_create_automation(%L, %L, 1000, %L, %L, %L, %L)',
    :'transfer_pocket', 'Transfer Automation', :'cash', 'weekly',
    '2026-01-01', 'UTC'
  ),
  'P0001',
  'AUTOMATION_TYPE_UNSUPPORTED',
  'AUTO-003: Automation untuk Pocket Transfer ditolak'
);

select throws_ok(
  format(
    'select public.rpc_create_automation(%L, %L, 1000, %L, %L, %L, %L)',
    :'income_pocket', 'Bad Frequency', :'cash', 'daily',
    '2026-01-01', 'UTC'
  ),
  'P0001',
  'INVALID_FREQUENCY',
  'AUTO: frekuensi Automation tidak valid ditolak'
);

select throws_ok(
  format(
    'select public.rpc_create_automation(%L, %L, 1000, %L, %L, NULL, %L)',
    :'income_pocket', 'No Start', :'cash', 'weekly', 'UTC'
  ),
  'P0001',
  'INVALID_DATE',
  'AUTO: tanggal mulai kosong ditolak'
);

select throws_ok(
  format(
    'select public.rpc_create_automation(%L, %L, 1000, %L, %L, %L, %L)',
    :'income_pocket', 'Bad TZ', :'cash', 'weekly',
    '2026-01-01', 'Mars/Olympus'
  ),
  'P0001',
  'VALIDATION_ERROR',
  'AUTO: timezone tidak valid ditolak'
);

select throws_ok(
  format(
    'select public.rpc_create_automation(%L, %L, 0, %L, %L, %L, %L)',
    :'income_pocket', 'Zero', :'cash', 'weekly', '2026-01-01', 'UTC'
  ),
  'P0001',
  'INVALID_AMOUNT',
  'AUTO: nominal Automation 0 ditolak'
);

select throws_ok(
  format(
    'select public.rpc_create_automation(%L, %L, 1000, %L, %L, %L, %L)',
    :'income_pocket', '   ', :'cash', 'weekly', '2026-01-01', 'UTC'
  ),
  'P0001',
  'VALIDATION_ERROR',
  'AUTO: nama Automation kosong ditolak'
);

select throws_ok(
  format(
    'select public.rpc_create_automation(%L, %L, 1000, %L, %L, %L, %L)',
    :'expense_pocket', 'Savings Expense', :'savings', 'weekly',
    '2026-01-01', 'UTC'
  ),
  'P0001',
  'SOURCE_FUND_NOT_ACTIVE',
  'AUTO: Expense Automation dengan Fund Savings/Goal ditolak'
);

select throws_ok(
  format(
    'select public.rpc_create_automation(%L, %L, 1000, %L, %L, %L, %L)',
    :'expense_pocket', 'Archived Expense', :'archived_fund', 'weekly',
    '2026-01-01', 'UTC'
  ),
  'P0001',
  'FUND_ARCHIVED',
  'AUTO: Expense Automation dengan Fund archived ditolak'
);

-- Income Automation boleh memakai Savings/Goal Fund. Jadwalnya jauh di depan
-- agar tidak ikut terproses pada skenario berikutnya.
select public.test_create_automation(
  :'income_pocket', 'Savings Income Automation', 100000, :'savings', 'monthly',
  '2026-06-01', 'UTC'
) as savings_income_auto \gset

select is(
  (select count(*) from public.automations where id = :'savings_income_auto'),
  1::bigint,
  'AUTO: Income Automation dengan Fund Savings/Goal diterima'
);

select public.test_create_automation(
  :'income_pocket', 'Jakarta Income Automation', 100000, :'cash', 'weekly',
  '2026-12-01', 'Asia/Jakarta'
) as jakarta_auto \gset

select is(
  (select next_run_at from public.automations where id = :'jakarta_auto'),
  '2026-11-30 17:00:00+00'::timestamptz,
  'AUTO-009: jadwal memakai tengah malam timezone tersimpan'
);

select public.test_create_income_item(:'income_pocket', 'Manual Item', 100000) as manual_item \gset

select throws_ok(
  format(
    'insert into public.automations (user_id, pocket_item_id, frequency, start_date, next_run_at, timezone) values (%L, %L, %L, %L, %L, %L)',
    :'alice', :'manual_item', 'weekly', '2026-01-01', '2026-01-01 00:00+00', 'UTC'
  ),
  'P0001',
  'POCKET_ITEM_STATUS_INVALID',
  'AUTO-031: Automation tidak dapat ditambahkan ke item yang sudah ada'
);

select throws_ok(
  format(
    'insert into public.automations (user_id, pocket_item_id, frequency, start_date, next_run_at, timezone) values (%L, %L, %L, %L, %L, %L)',
    :'alice', :'income_template', 'weekly', '2026-01-01', '2026-01-01 00:00+00', 'UTC'
  ),
  'P0001',
  'CONFLICT',
  'AUTO: satu Pocket Item hanya boleh memiliki satu Automation aktif'
);

-- ---------------------------------------------------------------------------
-- AUTO-004/005/006/007: perhitungan jadwal
-- ---------------------------------------------------------------------------

select is(
  public.automation_next_schedule(
    '2026-01-01 00:00:00+00', 'weekly', 'UTC', '2026-01-01'
  ),
  '2026-01-08 00:00:00+00'::timestamptz,
  'AUTO-004: jadwal weekly maju tujuh hari'
);

select is(
  public.automation_next_schedule(
    '2026-01-01 00:00:00+00', 'every_two_weeks', 'UTC', '2026-01-01'
  ),
  '2026-01-15 00:00:00+00'::timestamptz,
  'AUTO-005: jadwal every_two_weeks maju empat belas hari'
);

select is(
  public.automation_next_schedule(
    '2026-01-31 00:00:00+00', 'monthly', 'UTC', '2026-01-31'
  ),
  '2026-02-28 00:00:00+00'::timestamptz,
  'AUTO-007: jadwal bulanan tanggal 31 jatuh pada hari terakhir bulan'
);

select is(
  public.automation_next_schedule(
    '2026-02-28 00:00:00+00', 'monthly', 'UTC', '2026-01-31'
  ),
  '2026-03-31 00:00:00+00'::timestamptz,
  'AUTO-006: jadwal bulanan kembali ke tanggal asal bila tersedia'
);

select throws_ok(
  $$ select public.automation_next_schedule('2026-01-01 00:00+00', 'daily', 'UTC', '2026-01-01') $$,
  'P0001',
  'INVALID_FREQUENCY',
  'AUTO: frekuensi tidak dikenal ditolak saat menghitung jadwal'
);

-- ---------------------------------------------------------------------------
-- AUTO-010/011/012: pemrosesan jadwal jatuh tempo
-- ---------------------------------------------------------------------------

select public.rpc_process_due_automations('2026-01-15 12:00:00+00') as jan_result \gset

select is(
  (:'jan_result'::json)->>'created_occurrences',
  '3',
  'AUTO-011: tiga periode weekly yang terlewat menghasilkan tiga occurrence'
);

select is(
  (:'jan_result'::json)->>'created_notifications',
  '3',
  'AUTO-010: setiap occurrence baru mendapat satu Notification'
);

select is(
  (:'jan_result'::json)->>'processed_automations',
  '1',
  'AUTO-010: hanya Automation yang jatuh tempo diproses'
);

select is(
  (public.rpc_process_due_automations('2026-01-15 12:00:00+00'))->>'created_occurrences',
  '0',
  'AUTO-012: pemrosesan berulang tidak memproses periode yang sama'
);

select is(
  (select count(*) from public.automation_occurrences where automation_id = :'income_auto'),
  3::bigint,
  'AUTO-004: jumlah occurrence weekly sesuai periode jatuh tempo'
);

select is(
  (select count(*) from public.notifications n
   join public.automation_occurrences o on o.id = n.occurrence_id
   where o.automation_id = :'income_auto'),
  3::bigint,
  'AUTO-024: Notification pending tersedia untuk setiap occurrence'
);

select is(
  (select count(*) from public.v_pending_notifications where automation_id = :'income_auto'),
  3::bigint,
  'AUTO-024: view Notification pending menampilkan occurrence pending'
);

select is(
  (select next_run_at from public.automations where id = :'income_auto'),
  '2026-01-22 00:00:00+00'::timestamptz,
  'AUTO-010: next_run_at maju ke periode berikutnya'
);

select is(
  (
    select array_agg(scheduled_for order by scheduled_for)
    from public.automation_occurrences
    where automation_id = :'income_auto'
  ),
  array[
    '2026-01-01 00:00:00+00',
    '2026-01-08 00:00:00+00',
    '2026-01-15 00:00:00+00'
  ]::timestamptz[],
  'AUTO-011: occurrence dibuat untuk setiap periode yang terlewat'
);

select id as income_occ1
from public.automation_occurrences
where automation_id = :'income_auto'
order by scheduled_for
offset 0 limit 1
\gset

select id as income_occ2
from public.automation_occurrences
where automation_id = :'income_auto'
order by scheduled_for
offset 1 limit 1
\gset

select id as income_occ3
from public.automation_occurrences
where automation_id = :'income_auto'
order by scheduled_for
offset 2 limit 1
\gset

-- ---------------------------------------------------------------------------
-- AUTO-013 ... AUTO-018: konfirmasi dan penolakan Income Automation
-- ---------------------------------------------------------------------------

select public.test_confirm_occurrence(:'income_occ1', :'cash') as income_tx1 \gset

select is(public.fund_balance(:'cash'), 15000000::numeric, 'AUTO-013: saldo Fund tujuan bertambah setelah konfirmasi');

select is(
  (select status from public.automation_occurrences where id = :'income_occ1'),
  'confirmed'::text,
  'AUTO-013: occurrence menjadi confirmed'
);

select is(
  (select confirmed_amount from public.automation_occurrences where id = :'income_occ1'),
  5000000::numeric,
  'AUTO-013: confirmed_amount sama dengan nominal template'
);

select is(
  (select type from public.transactions where id = :'income_tx1'),
  'income'::text,
  'AUTO-013: transaksi Income Automation tercatat'
);

select is(
  (select occurred_at from public.transactions where id = :'income_tx1'),
  '2026-01-01 00:00:00+00'::timestamptz,
  'AUTO-013: tanggal transaksi mengikuti scheduled_for occurrence'
);

select is(
  (select pocket_item_id from public.transactions where id = :'income_tx1'),
  :'income_template'::uuid,
  'AUTO-013: transaksi terhubung ke template Automation'
);

select is(
  (select count(*) from public.notifications where occurrence_id = :'income_occ1'),
  0::bigint,
  'AUTO-026: Notification dihapus setelah konfirmasi'
);

select is(
  (select count(*) from public.v_pending_notifications where automation_id = :'income_auto'),
  2::bigint,
  'AUTO-024: Notification pending tersisa untuk occurrence lain'
);

select throws_ok(
  format('select public.rpc_confirm_occurrence(%L, %L, NULL)', :'income_occ1', :'cash'),
  'P0001',
  'OCCURRENCE_ALREADY_PROCESSED',
  'AUTO-016: konfirmasi berulang pada occurrence yang sama ditolak'
);

select throws_ok(
  format('select public.rpc_confirm_occurrence(%L, %L, 4000000)', :'income_occ2', :'cash'),
  'P0001',
  'AMOUNT_NOT_ALLOWED',
  'AUTO-032: nominal Income Automation tidak dapat diubah saat konfirmasi'
);

select is(
  (select status from public.automation_occurrences where id = :'income_occ2'),
  'pending'::text,
  'AUTO-032: occurrence tetap pending setelah nominal ditolak'
);

select lives_ok(
  format('select public.rpc_reject_occurrence(%L)', :'income_occ2'),
  'AUTO-014: Income occurrence dapat ditolak'
);

select is(
  (select status from public.automation_occurrences where id = :'income_occ2'),
  'rejected'::text,
  'AUTO-014: occurrence menjadi rejected'
);

select is(
  (select count(*) from public.transactions where user_id = :'alice' and type = 'income'),
  1::bigint,
  'AUTO-014: penolakan tidak membuat transaksi'
);

select is(
  (select count(*) from public.notifications where occurrence_id = :'income_occ2'),
  0::bigint,
  'AUTO-027: Notification dihapus setelah penolakan'
);

select throws_ok(
  format('select public.rpc_reject_occurrence(%L)', :'income_occ2'),
  'P0001',
  'OCCURRENCE_ALREADY_PROCESSED',
  'AUTO-027: penolakan berulang ditolak'
);

select throws_ok(
  format('select public.rpc_confirm_occurrence(%L, %L, NULL)', :'income_occ2', :'cash'),
  'P0001',
  'OCCURRENCE_ALREADY_PROCESSED',
  'AUTO: occurrence rejected tidak dapat dikonfirmasi'
);

select lives_ok(
  format(
    'select public.rpc_update_pocket_transaction(%L, 5500000, %L, NULL, %L)',
    :'income_tx1', '2026-01-01 00:00:00+00', :'cash'
  ),
  'AUTO: transaksi Income Automation dapat diedit setelah konfirmasi'
);

select is(
  (select amount from public.transactions where id = :'income_tx1'),
  5500000::numeric,
  'AUTO: nominal transaksi Income Automation berubah'
);

select is(
  (select amount from public.pocket_items where id = :'income_template'),
  5000000::numeric,
  'AUTO: pengeditan transaksi tidak mengubah nominal template'
);

select is(public.fund_balance(:'cash'), 15500000::numeric, 'AUTO: saldo mengikuti nominal transaksi terbaru');

select public.test_confirm_occurrence(:'income_occ3', :'savings') as income_tx3 \gset

select is(public.fund_balance(:'savings'), 6000000::numeric, 'AUTO-033: Fund tujuan dapat diganti saat konfirmasi');

select is(
  (select destination_fund_id from public.transactions where id = :'income_tx3'),
  :'savings'::uuid,
  'AUTO-033: transaksi memakai Fund yang dipilih saat konfirmasi'
);

-- ---------------------------------------------------------------------------
-- Pemrosesan periode berikutnya dan konfirmasi Expense Automation
-- ---------------------------------------------------------------------------

select public.rpc_process_due_automations('2026-02-01 00:00:00+00') as feb_result \gset

select is(
  (:'feb_result'::json)->>'created_occurrences',
  '3',
  'AUTO-004: periode weekly dan monthly berikutnya dibuat'
);

select is(
  (:'feb_result'::json)->>'created_notifications',
  '3',
  'AUTO-010: Notification untuk periode berikutnya dibuat'
);

select is(
  (:'feb_result'::json)->>'processed_automations',
  '2',
  'AUTO-010: dua Automation jatuh tempo diproses'
);

select is(
  (public.rpc_process_due_automations('2026-02-01 00:00:00+00'))->>'created_occurrences',
  '0',
  'AUTO-012: pemeriksaan ulang tidak membuat occurrence duplikat'
);

select id as expense_occ1
from public.automation_occurrences
where automation_id = :'expense_auto'
order by scheduled_for
limit 1
\gset

select is(
  (select scheduled_for from public.automation_occurrences where id = :'expense_occ1'),
  '2026-01-31 00:00:00+00'::timestamptz,
  'AUTO-006: occurrence Expense bulanan dibuat pada tanggal jadwal'
);

select public.test_confirm_occurrence(:'expense_occ1', :'cash') as expense_tx1 \gset

select is(public.fund_balance(:'cash'), 14500000::numeric, 'AUTO-019: saldo Fund sumber berkurang setelah konfirmasi Expense');

select is(
  (select type from public.transactions where id = :'expense_tx1'),
  'expense'::text,
  'AUTO-019: transaksi Expense Automation tercatat'
);

select is(
  (select amount from public.transactions where id = :'expense_tx1'),
  1000000::numeric,
  'AUTO-019: transaksi memakai nominal template Expense'
);

select is(
  (select amount from public.pocket_items where id = :'expense_template'),
  1000000::numeric,
  'AUTO-020: nominal template Expense tidak berubah setelah konfirmasi'
);

select is(
  (select status from public.automation_occurrences where id = :'expense_occ1'),
  'confirmed'::text,
  'AUTO-019: occurrence Expense menjadi confirmed'
);

select throws_ok(
  format('select public.rpc_confirm_occurrence(%L, %L, NULL)', :'expense_occ1', :'cash'),
  'P0001',
  'OCCURRENCE_ALREADY_PROCESSED',
  'AUTO-023: konfirmasi Expense berulang ditolak'
);

-- ---------------------------------------------------------------------------
-- Automation Expense: override nominal, fund alternatif, kegagalan validasi
-- ---------------------------------------------------------------------------

select public.test_create_automation(
  :'expense_pocket', 'Utilities Automation', 200000, :'cash', 'monthly',
  '2026-03-01', 'UTC'
) as utilities_auto \gset

select public.test_create_automation(
  :'expense_pocket', 'Big Expense Automation', 20000000, :'cash', 'monthly',
  '2026-03-01', 'UTC'
) as big_expense_auto \gset

select public.test_create_automation(
  :'expense_pocket', 'Subscription Automation', 50000, :'cash', 'monthly',
  '2026-03-01', 'UTC'
) as subscription_auto \gset

select pocket_item_id as utilities_template
from public.automations where id = :'utilities_auto'
\gset

select pocket_item_id as big_template
from public.automations where id = :'big_expense_auto'
\gset

select pocket_item_id as subscription_template
from public.automations where id = :'subscription_auto'
\gset

select public.rpc_process_due_automations('2026-03-01 00:00:00+00') as mar_result \gset

select is(
  (:'mar_result'::json)->>'created_occurrences',
  '8',
  'AUTO-010: seluruh Automation jatuh tempo diproses'
);

select is(
  (:'mar_result'::json)->>'created_notifications',
  '8',
  'AUTO-010: Notification dibuat untuk seluruh occurrence baru'
);

select is(
  (:'mar_result'::json)->>'processed_automations',
  '5',
  'AUTO-010: jumlah Automation yang diproses sesuai'
);

select is(
  (public.rpc_process_due_automations('2026-03-01 00:00:00+00'))->>'created_occurrences',
  '0',
  'AUTO-012: pemanggilan ulang tidak membuat occurrence duplikat'
);

select id as expense_occ2
from public.automation_occurrences
where automation_id = :'expense_auto'
  and scheduled_for = '2026-02-28 00:00:00+00'
\gset

select public.test_confirm_occurrence(:'expense_occ2', :'cash', 750000) as expense_tx2 \gset

select is(
  (select amount from public.transactions where id = :'expense_tx2'),
  750000::numeric,
  'AUTO-020: nominal konfirmasi Expense override dipakai transaksi'
);

select is(
  (select confirmed_amount from public.automation_occurrences where id = :'expense_occ2'),
  750000::numeric,
  'AUTO-020: confirmed_amount menyimpan nominal konfirmasi'
);

select is(
  (select amount from public.pocket_items where id = :'expense_template'),
  1000000::numeric,
  'AUTO-020: nominal template Expense tetap tidak berubah'
);

select is(public.fund_balance(:'cash'), 13750000::numeric, 'AUTO-020: saldo memakai nominal konfirmasi');

select lives_ok(
  format('select public.rpc_delete_pocket_transaction(%L)', :'expense_tx2'),
  'AUTO: transaksi hasil Expense Automation dapat dihapus'
);

select is(public.fund_balance(:'cash'), 14500000::numeric, 'AUTO: penghapusan transaksi Expense memulihkan saldo');

select is(
  (select count(*) from public.automation_occurrences where id = :'expense_occ2'),
  0::bigint,
  'AUTO: penghapusan transaksi Expense menghapus occurrence terkait'
);

select is(
  (select count(*) from public.pocket_items where id = :'expense_template'),
  1::bigint,
  'AUTO: template Expense tetap ada setelah transaksi dihapus'
);

select id as utilities_occ
from public.automation_occurrences
where automation_id = :'utilities_auto'
limit 1
\gset

select public.test_confirm_occurrence(:'utilities_occ', :'other') as utilities_tx \gset

select is(public.fund_balance(:'other'), 4800000::numeric, 'AUTO-033: Expense Automation memakai Fund alternatif saat konfirmasi');

select is(
  (select source_fund_id from public.transactions where id = :'utilities_tx'),
  :'other'::uuid,
  'AUTO-033: transaksi Expense memakai Fund sumber yang dipilih'
);

select id as big_occ
from public.automation_occurrences
where automation_id = :'big_expense_auto'
limit 1
\gset

select throws_ok(
  format('select public.rpc_confirm_occurrence(%L, %L, NULL)', :'big_occ', :'cash'),
  'P0001',
  'INSUFFICIENT_BALANCE',
  'AUTO-022: konfirmasi Expense melebihi saldo ditolak'
);

select is(
  (select status from public.automation_occurrences where id = :'big_occ'),
  'pending'::text,
  'AUTO-022: occurrence tetap pending setelah saldo tidak mencukupi'
);

select is(public.fund_balance(:'cash'), 14500000::numeric, 'AUTO-022: saldo tidak berubah setelah konfirmasi ditolak');

select throws_ok(
  format('select public.rpc_confirm_occurrence(%L, %L, NULL)', :'big_occ', :'savings'),
  'P0001',
  'SOURCE_FUND_NOT_ACTIVE',
  'AUTO-035: konfirmasi Expense dengan Fund Savings/Goal ditolak'
);

select throws_ok(
  format('select public.rpc_confirm_occurrence(%L, %L, NULL)', :'big_occ', :'archived_fund'),
  'P0001',
  'FUND_ARCHIVED',
  'AUTO-036: konfirmasi Expense dengan Fund archived ditolak'
);

select is(
  (select status from public.automation_occurrences where id = :'big_occ'),
  'pending'::text,
  'AUTO-035/036: occurrence tetap pending setelah Fund tidak valid'
);

select lives_ok(
  format('select public.rpc_reject_occurrence(%L)', :'big_occ'),
  'AUTO-021: Expense occurrence dapat ditolak'
);

select is(
  (select count(*) from public.notifications where occurrence_id = :'big_occ'),
  0::bigint,
  'AUTO-027: Notification Expense dihapus setelah penolakan'
);

select is(
  (select count(*) from public.transactions where pocket_item_id = :'big_template'),
  0::bigint,
  'AUTO-021: penolakan Expense tidak membuat transaksi'
);

-- ---------------------------------------------------------------------------
-- AUTO-008/009: perubahan Automation
-- ---------------------------------------------------------------------------

select is(
  (select count(*) from public.automation_occurrences where automation_id = :'income_auto' and status = 'pending'),
  6::bigint,
  'AUTO: occurrence pending tersedia sebelum Automation diubah'
);

select lives_ok(
  format(
    'select public.rpc_update_automation(%L, %L, 6000000, %L, %L, %L, %L)',
    :'income_auto', 'Salary Updated', :'other', 'every_two_weeks',
    '2026-04-01', 'Asia/Jakarta'
  ),
  'AUTO-008: Automation dapat diubah'
);

select is(
  (select name from public.pocket_items where id = :'income_template'),
  'Salary Updated'::text,
  'AUTO-008: nama template mengikuti perubahan Automation'
);

select is(
  (select amount from public.pocket_items where id = :'income_template'),
  6000000::numeric,
  'AUTO-008: nominal template mengikuti perubahan Automation'
);

select is(
  (select fund_id from public.pocket_items where id = :'income_template'),
  :'other'::uuid,
  'AUTO-008: Fund default template mengikuti perubahan Automation'
);

select is(
  (select next_run_at from public.automations where id = :'income_auto'),
  '2026-03-31 17:00:00+00'::timestamptz,
  'AUTO-008: jadwal berikutnya dihitung dari tanggal mulai baru'
);

select is(
  (select timezone from public.automations where id = :'income_auto'),
  'Asia/Jakarta'::text,
  'AUTO-009: timezone Automation tersimpan'
);

select is(
  (select count(*) from public.automation_occurrences where automation_id = :'income_auto' and status = 'pending'),
  0::bigint,
  'AUTO-008: occurrence pending lama dihapus saat Automation diubah'
);

select is(
  (select count(*) from public.notifications n
   join public.automation_occurrences o on o.id = n.occurrence_id
   where o.automation_id = :'income_auto'),
  0::bigint,
  'AUTO-008: Notification occurrence pending lama ikut dihapus'
);

select is(
  (select count(*) from public.automation_occurrences where automation_id = :'income_auto' and status = 'confirmed'),
  2::bigint,
  'AUTO-008: occurrence confirmed tidak terpengaruh perubahan Automation'
);

select is(
  (select count(*) from public.transactions where pocket_item_id = :'income_template'),
  2::bigint,
  'AUTO-008: transaksi hasil konfirmasi tetap tersimpan'
);

select throws_ok(
  format(
    'select public.rpc_update_automation(%L, %L, 6000000, %L, %L, %L, %L)',
    :'income_auto', 'Bad', :'other', 'daily', '2026-04-01', 'Asia/Jakarta'
  ),
  'P0001',
  'INVALID_FREQUENCY',
  'AUTO: perubahan frekuensi tidak valid ditolak'
);

select throws_ok(
  format(
    'select public.rpc_update_automation(%L, %L, 6000000, %L, %L, NULL, %L)',
    :'income_auto', 'Bad', :'other', 'weekly', 'Asia/Jakarta'
  ),
  'P0001',
  'INVALID_DATE',
  'AUTO: perubahan tanggal mulai kosong ditolak'
);

select throws_ok(
  format(
    'select public.rpc_update_automation(%L, %L, 6000000, %L, %L, %L, %L)',
    :'income_auto', 'Bad', :'other', 'weekly', '2026-04-01', 'Mars/Olympus'
  ),
  'P0001',
  'VALIDATION_ERROR',
  'AUTO: perubahan timezone tidak valid ditolak'
);

select throws_ok(
  format(
    'select public.rpc_update_automation(%L, %L, 1000000, %L, %L, %L, %L)',
    :'expense_auto', 'Bad Fund', :'savings', 'monthly', '2026-04-01', 'UTC'
  ),
  'P0001',
  'SOURCE_FUND_NOT_ACTIVE',
  'AUTO: perubahan Expense Automation ke Fund Savings/Goal ditolak'
);

-- ---------------------------------------------------------------------------
-- AUTO-017: proteksi penghapusan Income Automation Transaction
-- ---------------------------------------------------------------------------

select throws_ok(
  format('select public.rpc_delete_pocket_transaction(%L)', :'income_tx1'),
  'P0001',
  'TRANSACTION_PROTECTED',
  'AUTO-017: penghapusan transaksi Income Automation ditolak'
);

select throws_ok(
  format('delete from public.transactions where id = %L', :'income_tx1'),
  'P0001',
  'TRANSACTION_PROTECTED',
  'AUTO-017: proteksi berlaku juga pada penghapusan langsung'
);

select throws_ok(
  format('select public.rpc_delete_standalone_transaction(%L)', :'income_tx1'),
  'P0001',
  'TRANSACTION_MANAGED_BY_POCKET',
  'AUTO-017: transaksi Automation bukan transaksi standalone'
);

select throws_ok(
  format(
    'select public.rpc_update_standalone_transaction(%L, 5500000, now(), NULL, %L, %L)',
    :'income_tx1', :'cash', public.test_category('income', 'Salary')
  ),
  'P0001',
  'TRANSACTION_MANAGED_BY_POCKET',
  'AUTO: transaksi Automation diedit melalui alur Pocket'
);

select is(
  (select count(*) from public.transactions where id = :'income_tx1'),
  1::bigint,
  'AUTO-017: transaksi tetap ada setelah penghapusan ditolak'
);

select is(public.fund_balance(:'cash'), 14500000::numeric, 'AUTO-017: saldo tidak berubah setelah penghapusan ditolak');

-- ---------------------------------------------------------------------------
-- AUTH-003: batas kepemilikan Automation dan occurrence
-- ---------------------------------------------------------------------------

select id as subscription_occ
from public.automation_occurrences
where automation_id = :'subscription_auto'
limit 1
\gset

select public.test_set_claims(:'bob');

select public.test_create_fund('Bob Cash', 1000000, 'active') as bob_cash \gset
select public.test_create_pocket('Bob Income Pocket', 'income') as bob_pocket \gset
select public.test_create_automation(
  :'bob_pocket', 'Bob Salary', 100000, :'bob_cash', 'weekly', '2026-01-01', 'UTC'
) as bob_auto \gset

select is(
  (public.rpc_process_due_automations('2026-01-01 00:00:00+00'))->>'created_occurrences',
  '1',
  'AUTH-003: pemrosesan jadwal hanya mengenai Automation milik pengguna'
);

select is(
  (select count(*) from public.rpc_get_pending_notifications()),
  1::bigint,
  'AUTH-003: Notification pengguna lain tidak terlihat'
);

select throws_ok(
  format('select public.rpc_confirm_occurrence(%L, %L, NULL)', :'subscription_occ', :'bob_cash'),
  'P0001',
  'OCCURRENCE_NOT_FOUND',
  'AUTH-003: pengguna lain tidak dapat mengonfirmasi occurrence'
);

select throws_ok(
  format('select public.rpc_reject_occurrence(%L)', :'subscription_occ'),
  'P0001',
  'OCCURRENCE_NOT_FOUND',
  'AUTH-003: pengguna lain tidak dapat menolak occurrence'
);

select throws_ok(
  format(
    'select public.rpc_update_automation(%L, %L, 1000000, %L, %L, %L, %L)',
    :'income_auto', 'Hijack', :'bob_cash', 'weekly', '2026-04-01', 'UTC'
  ),
  'P0001',
  'AUTOMATION_NOT_FOUND',
  'AUTH-003: pengguna lain tidak dapat mengubah Automation'
);

select throws_ok(
  format('select public.rpc_delete_automation(%L)', :'income_auto'),
  'P0001',
  'AUTOMATION_NOT_FOUND',
  'AUTH-003: pengguna lain tidak dapat menghapus Automation'
);

select public.test_set_claims(:'alice');

-- ---------------------------------------------------------------------------
-- AUTO-028/029/030/034: penghapusan Automation
-- ---------------------------------------------------------------------------

select lives_ok(
  format('select public.rpc_delete_automation(%L)', :'income_auto'),
  'AUTO-029: Automation yang memiliki transaksi dapat dihapus'
);

select is(
  (select count(*) from public.automations where id = :'income_auto'),
  0::bigint,
  'AUTO-029: Automation benar-benar terhapus'
);

select is(
  (select count(*) from public.pocket_items where id = :'income_template'),
  0::bigint,
  'AUTO-034: template Income Automation ikut terhapus'
);

select is(
  (select count(*) from public.automation_occurrences where automation_id = :'income_auto'),
  0::bigint,
  'AUTO-030: occurrence Automation terhapus bersama Automation'
);

select is(
  (select count(*) from public.transactions where pocket_item_id = :'income_template'),
  0::bigint,
  'AUTO-029: transaksi aktual tidak lagi terhubung ke template'
);

select is(
  (select count(*) from public.transactions where id in (:'income_tx1', :'income_tx3')),
  2::bigint,
  'AUTO-029: transaksi aktual dipertahankan setelah Automation dihapus'
);

select is(
  (select category_id from public.transactions where id = :'income_tx1'),
  public.test_category('income', 'Other Income'),
  'AUTO-029: Income Automation Transaction mendapat Category Other Income'
);

select is(
  (select pocket_item_id from public.transactions where id = :'income_tx1'),
  null::uuid,
  'AUTO-029: transaksi menjadi transaksi tanpa Pocket'
);

select is(public.fund_balance(:'cash'), 14500000::numeric, 'AUTO-034: Active Balance tidak berubah oleh penghapusan template');

select is(public.fund_balance(:'savings'), 6000000::numeric, 'AUTO-034: saldo Fund Savings tidak berubah');

select lives_ok(
  format('select public.rpc_delete_standalone_transaction(%L)', :'income_tx1'),
  'AUTO-017: transaksi dapat dihapus setelah Automation asalnya dihapus'
);

select is(public.fund_balance(:'cash'), 9000000::numeric, 'AUTO-017: dampak transaksi dibalik setelah menjadi transaksi biasa');

select lives_ok(
  format('select public.rpc_delete_automation(%L)', :'subscription_auto'),
  'AUTO-028: Automation dengan occurrence pending dapat dihapus'
);

select is(
  (select count(*) from public.automation_occurrences where automation_id = :'subscription_auto'),
  0::bigint,
  'AUTO-028: occurrence pending terhapus'
);

select is(
  (select count(*) from public.pocket_items where id = :'subscription_template'),
  0::bigint,
  'AUTO-028: template item terhapus'
);

select is(
  (select count(*) from public.transactions where pocket_item_id = :'subscription_template'),
  0::bigint,
  'AUTO-028: tidak ada transaksi dari Automation pending'
);

select lives_ok(
  format('select public.rpc_delete_automation(%L)', :'expense_auto'),
  'AUTO-029: Expense Automation yang memiliki transaksi dapat dihapus'
);

select is(
  (select count(*) from public.transactions where id = :'expense_tx1'),
  1::bigint,
  'AUTO-029: Expense Transaction dipertahankan'
);

select is(
  (select category_id from public.transactions where id = :'expense_tx1'),
  public.test_category('expense', 'Other'),
  'AUTO-029: Expense Transaction mendapat Category Other'
);

select is(
  (select pocket_item_id from public.transactions where id = :'expense_tx1'),
  null::uuid,
  'AUTO-029: Expense Transaction menjadi transaksi tanpa Pocket'
);

select is(public.fund_balance(:'cash'), 9000000::numeric, 'AUTO-029: saldo tidak berubah oleh penghapusan Expense Automation');

select lives_ok(
  format('select public.rpc_delete_automation(%L)', :'big_expense_auto'),
  'AUTO-030: Automation dengan occurrence rejected dapat dihapus'
);

select is(
  (select count(*) from public.automation_occurrences where automation_id = :'big_expense_auto'),
  0::bigint,
  'AUTO-030: occurrence rejected terhapus bersama Automation'
);

select is(
  (select count(*) from public.transactions where pocket_item_id = :'big_template'),
  0::bigint,
  'AUTO-030: occurrence rejected tidak meninggalkan transaksi'
);

select is(
  coalesce(
    (select total from public.v_outstanding_expense_allocation where user_id = :'alice'),
    0
  ),
  0::numeric,
  'AUTO-034: template Automation tidak pernah dihitung sebagai alokasi'
);

reset role;

select * from finish();
rollback;
