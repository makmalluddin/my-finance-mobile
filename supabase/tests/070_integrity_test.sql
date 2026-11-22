begin;

\ir helpers.inc

select no_plan();

select public.test_create_user('alice-int@example.com') as alice \gset
select public.test_create_user('bob-int@example.com') as bob \gset

set local role authenticated;
select public.test_set_claims(:'alice');

select public.test_create_fund('Cash', 100, 'active') as cash \gset
select public.test_create_fund('Savings', 0, 'savings_goal') as savings \gset

select public.test_category('income', 'Salary') as salary \gset
select public.test_category('expense', 'Food') as food \gset

-- ---------------------------------------------------------------------------
-- INT-001/002: kegagalan mutasi tidak meninggalkan perubahan parsial
-- ---------------------------------------------------------------------------

select throws_ok(
  format('select public.rpc_create_expense(200, now(), %L, %L)', :'cash', :'food'),
  'P0001',
  'INSUFFICIENT_BALANCE',
  'INT-001: Expense yang melebihi saldo ditolak'
);

select is(
  (select count(*) from public.transactions),
  0::bigint,
  'INT-001: tidak ada transaksi parsial setelah Expense ditolak'
);

select is(public.fund_balance(:'cash'), 100::numeric, 'INT-001: saldo Fund tidak berubah');

select throws_ok(
  format('select public.rpc_create_transfer(200, now(), %L, %L)', :'cash', :'savings'),
  'P0001',
  'INSUFFICIENT_BALANCE',
  'INT-002: Transfer yang melebihi saldo ditolak'
);

select is(public.fund_balance(:'cash'), 100::numeric, 'INT-002: saldo sumber tidak berubah');
select is(public.fund_balance(:'savings'), 0::numeric, 'INT-002: saldo tujuan tidak berubah');

select public.test_income(50, now(), :'cash', :'salary') as income_tx \gset

select throws_ok(
  format('update public.transactions set type = %L where id = %L', 'expense', :'income_tx'),
  'P0001',
  'TRANSACTION_TYPE_IMMUTABLE',
  'INT: jenis transaksi tidak dapat diubah langsung'
);

select throws_ok(
  format(
    'select public.rpc_update_standalone_transaction(%L, 60, now(), NULL, %L, %L)',
    :'income_tx', :'cash', :'food'
  ),
  'P0001',
  'CATEGORY_TYPE_MISMATCH',
  'INT: perubahan dengan Category salah ditolak sebelum penulisan'
);

select is(
  (select amount from public.transactions where id = :'income_tx'),
  50::numeric,
  'INT: nominal transaksi tidak berubah setelah validasi gagal'
);

select is(public.fund_balance(:'cash'), 150::numeric, 'INT: saldo tetap konsisten setelah validasi gagal');

-- ---------------------------------------------------------------------------
-- INT-001: pembuatan Automation bersifat atomik
-- ---------------------------------------------------------------------------

select public.test_create_pocket('Expense Pocket', 'expense') as expense_pocket \gset

select throws_ok(
  format(
    'select public.rpc_create_automation(%L, %L, 10, %L, %L, %L, %L)',
    :'expense_pocket', 'Invalid', :'savings', 'weekly', '2026-01-01', 'UTC'
  ),
  'P0001',
  'SOURCE_FUND_NOT_ACTIVE',
  'INT-001: Automation dengan Fund tidak valid ditolak'
);

select is(
  (select count(*) from public.pocket_items where pocket_id = :'expense_pocket'),
  0::bigint,
  'INT-001: template tidak ditinggalkan saat Automation gagal dibuat'
);

select public.test_create_pocket('Income Pocket', 'income') as income_pocket \gset

select public.test_create_automation(
  :'income_pocket', 'Salary Automation', 1000, :'cash', 'weekly',
  '2026-01-01', 'UTC'
) as income_auto \gset

select pocket_item_id as income_template
from public.automations where id = :'income_auto'
\gset

select public.rpc_process_due_automations('2026-01-01 00:00:00+00');

select id as occurrence
from public.automation_occurrences
where automation_id = :'income_auto'
limit 1
\gset

select automation_id as occ_automation,
       pocket_item_id as occ_item,
       scheduled_for as occ_scheduled
from public.automation_occurrences
where id = :'occurrence'
\gset

-- ---------------------------------------------------------------------------
-- INT-005: idempotency dan constraint integrity
-- ---------------------------------------------------------------------------

select throws_ok(
  format(
    'insert into public.automation_occurrences (user_id, automation_id, pocket_item_id, scheduled_for, status) values (%L, %L, %L, %L, %L)',
    :'alice', :'occ_automation', :'occ_item', :'occ_scheduled', 'pending'
  ),
  '23505',
  null,
  'INT-005: occurrence duplikat untuk periode yang sama ditolak'
);

select is(
  (select count(*) from public.automation_occurrences where automation_id = :'income_auto'),
  1::bigint,
  'INT-005: jumlah occurrence tetap satu setelah duplikasi ditolak'
);

select public.test_confirm_occurrence(:'occurrence', :'cash') as auto_tx \gset

select throws_ok(
  format('insert into public.notifications (user_id, occurrence_id) values (%L, %L)', :'alice', :'occurrence'),
  'P0001',
  'OCCURRENCE_ALREADY_PROCESSED',
  'INT: Notification hanya boleh dibuat untuk occurrence pending'
);

select throws_ok(
  format('update public.automation_occurrences set status = %L where id = %L', 'rejected', :'occurrence'),
  'P0001',
  'OCCURRENCE_ALREADY_PROCESSED',
  'INT: occurrence yang sudah diproses tidak dapat diubah'
);

select throws_ok(
  format('update public.pocket_items set status = %L where id = %L', 'pending', :'income_template'),
  'P0001',
  'POCKET_ITEM_STATUS_INVALID',
  'INT: status template Automation tidak dapat diubah menjadi non-template'
);

select is(
  (select status from public.pocket_items where id = :'income_template'),
  'template'::text,
  'INT: status template tetap tidak berubah'
);

-- ---------------------------------------------------------------------------
-- AUTH-003/INT-007: penulisan langsung lintas pengguna
-- ---------------------------------------------------------------------------

select public.test_set_claims(:'bob');

select throws_ok(
  format(
    'insert into public.automation_occurrences (user_id, automation_id, pocket_item_id, scheduled_for, status) values (%L, %L, %L, %L, %L)',
    :'bob', :'occ_automation', :'occ_item', '2026-02-01 00:00:00+00', 'pending'
  ),
  'P0001',
  'AUTOMATION_NOT_FOUND',
  'AUTH-003: pengguna lain tidak dapat membuat occurrence dari template orang lain'
);

select throws_ok(
  format('insert into public.notifications (user_id, occurrence_id) values (%L, %L)', :'bob', :'occurrence'),
  'P0001',
  'OCCURRENCE_NOT_FOUND',
  'AUTH-003: pengguna lain tidak dapat membuat Notification untuk occurrence orang lain'
);

select public.test_set_claims(:'alice');

select is(
  (select count(*) from public.automation_occurrences where automation_id = :'income_auto'),
  1::bigint,
  'INT-007: occurrence milik pengguna utuh setelah serangan lintas pengguna'
);

select is(
  (select count(*) from public.notifications where occurrence_id = :'occurrence'),
  0::bigint,
  'INT-007: Notification tidak bertambah setelah dikonfirmasi'
);

select is(
  (select count(*) from public.transactions where user_id = :'alice'),
  2::bigint,
  'INT-007: transaksi milik pengguna utuh setelah serangan lintas pengguna'
);

select is(public.fund_balance(:'cash'), 1150::numeric, 'INT-010: saldo akhir konsisten dengan seluruh transaksi');

-- Catatan: INT-003/INT-004 (request bersamaan) memerlukan dua koneksi/klien
-- dan diverifikasi lewat pengujian manual, bukan di dalam satu transaksi pgTAP.

reset role;

select * from finish();
rollback;
