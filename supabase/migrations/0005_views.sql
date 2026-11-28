-- 0005_views.sql
-- Read model untuk saldo Fund, alokasi Planned Expense, ringkasan Transfer
-- Pocket, dan Notification pending. Semua view memakai security_invoker agar
-- RLS tetap berlaku.

-- Helper saldo Fund. Harus dibuat setelah tabel transactions tersedia.
create or replace function public.fund_balance(p_fund_id uuid)
returns numeric
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select
    f.opening_balance
    + coalesce(
        (
          select sum(t.amount)
          from public.transactions t
          where t.destination_fund_id = f.id
            and t.type in ('income', 'transfer')
        ),
        0
      )
    - coalesce(
        (
          select sum(t.amount)
          from public.transactions t
          where t.source_fund_id = f.id
            and t.type in ('expense', 'transfer')
        ),
        0
      )
  from public.funds f
  where f.id = p_fund_id;
$$;

create or replace view public.v_fund_balances
with (security_invoker = true)
as
select
  f.id,
  f.user_id,
  f.name,
  f.fund_type,
  f.is_archived,
  f.opening_balance,
  public.fund_balance(f.id) as balance
from public.funds f;

create or replace view public.v_outstanding_expense_allocation
with (security_invoker = true)
as
select
  pi.user_id,
  coalesce(sum(pi.amount), 0)::numeric(14, 2) as total
from public.pocket_items pi
join public.pockets p on p.id = pi.pocket_id
where p.type = 'expense'
  and pi.status = 'planned'
group by pi.user_id;

create or replace view public.v_pocket_transfer_summary
with (security_invoker = true)
as
select
  p.id as pocket_id,
  coalesce(sum(t.amount), 0)::numeric(14, 2) as incoming,
  coalesce(sum(t.amount), 0)::numeric(14, 2) as outgoing,
  0::numeric(14, 2) as net,
  count(distinct pi.id)::integer as item_count
from public.pockets p
left join public.pocket_items pi on pi.pocket_id = p.id
left join public.transactions t
  on t.pocket_item_id = pi.id
  and t.type = 'transfer'
where p.type = 'transfer'
group by p.id;

create or replace view public.v_pending_notifications
with (security_invoker = true)
as
select
  n.id,
  o.id as occurrence_id,
  o.automation_id,
  p.id as pocket_id,
  p.name as pocket_name,
  p.type as pocket_type,
  pi.id as pocket_item_id,
  pi.name as item_name,
  pi.amount as template_amount,
  pi.fund_id as default_fund_id,
  o.scheduled_for,
  n.created_at
from public.notifications n
join public.automation_occurrences o on o.id = n.occurrence_id
join public.pocket_items pi on pi.id = o.pocket_item_id
join public.pockets p on p.id = pi.pocket_id
left join public.automations a on a.id = o.automation_id
where o.status = 'pending';

revoke all on function public.fund_balance(uuid) from public, anon;
grant execute on function public.fund_balance(uuid) to authenticated;

grant select on public.v_fund_balances to authenticated;
grant select on public.v_outstanding_expense_allocation to authenticated;
grant select on public.v_pocket_transfer_summary to authenticated;
grant select on public.v_pending_notifications to authenticated;
