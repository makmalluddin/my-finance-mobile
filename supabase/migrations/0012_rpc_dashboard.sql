-- 0012_rpc_dashboard.sql
-- RPC agregasi Dashboard.

create or replace function public.rpc_get_dashboard(
  p_today date,
  p_timezone text
)
returns json
language plpgsql
stable
security invoker
set search_path = public, pg_temp
as $$
declare
  v_user uuid := public.require_user();
  v_total_active numeric;
  v_outstanding numeric;
  v_active_funds json;
  v_expense_series json;
  v_pending_notifications integer;
begin
  if p_today is null then
    perform public.raise_app_error(
      'VALIDATION_ERROR',
      jsonb_build_object('field', 'today')
    );
  end if;

  if p_timezone is null or not public.is_valid_timezone(p_timezone) then
    perform public.raise_app_error(
      'VALIDATION_ERROR',
      jsonb_build_object('reason', 'invalid_timezone', 'timezone', p_timezone)
    );
  end if;

  select coalesce(sum(public.fund_balance(f.id)), 0)
  into v_total_active
  from public.funds f
  where f.user_id = v_user
    and f.fund_type = 'active'
    and not f.is_archived;

  select coalesce(
    (
      select a.total
      from public.v_outstanding_expense_allocation a
      where a.user_id = v_user
    ),
    0
  )
  into v_outstanding;

  select coalesce(
    json_agg(
      json_build_object(
        'id', f.id,
        'name', f.name,
        'balance', public.fund_balance(f.id)::text
      )
      order by f.name
    ),
    '[]'::json
  )
  into v_active_funds
  from public.funds f
  where f.user_id = v_user
    and f.fund_type = 'active'
    and not f.is_archived;

  select coalesce(
    json_agg(
      json_build_object(
        'date', s.day::text,
        'total', s.total::text
      )
      order by s.day
    ),
    '[]'::json
  )
  into v_expense_series
  from (
    select
      d::date as day,
      coalesce(sum(t.amount), 0) as total
    from generate_series(
      (p_today - 6)::timestamp,
      p_today::timestamp,
      interval '1 day'
    ) as d
    left join public.transactions t
      on t.user_id = v_user
      and t.type = 'expense'
      and (t.occurred_at at time zone p_timezone)::date = d::date
    group by d::date
  ) s;

  select count(*)
  into v_pending_notifications
  from public.notifications n
  where n.user_id = v_user;

  return json_build_object(
    'active_balance', (v_total_active - v_outstanding)::text,
    'total_active_funds_balance', v_total_active::text,
    'outstanding_expense_allocation', v_outstanding::text,
    'active_funds', v_active_funds,
    'expense_series', v_expense_series,
    'pending_notifications', v_pending_notifications
  );
end;
$$;

revoke all on function public.rpc_get_dashboard(date, text) from public, anon;
grant execute on function public.rpc_get_dashboard(date, text) to authenticated;
