-- 0013_rpc_schedule.sql
-- Pemrosesan Automation yang jatuh tempo saat aplikasi aktif/refresh.

create or replace function public.rpc_process_due_automations(
  p_now timestamptz default now()
)
returns json
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_user uuid := public.require_user();
  v_now timestamptz := coalesce(p_now, now());
  v_automation public.automations%rowtype;
  v_scheduled timestamptz;
  v_occurrence_id uuid;
  v_created_occurrences integer := 0;
  v_created_notifications integer := 0;
  v_processed_automations integer := 0;
  v_batch integer;
begin
  for v_automation in
    select *
    from public.automations
    where user_id = v_user
      and is_active
      and next_run_at <= v_now
    order by next_run_at, id
    for update
  loop
    v_scheduled := v_automation.next_run_at;
    v_batch := 0;

    while v_scheduled <= v_now and v_batch < 500 loop
      v_occurrence_id := null;

      insert into public.automation_occurrences (
        user_id,
        automation_id,
        pocket_item_id,
        scheduled_for,
        status
      )
      values (
        v_user,
        v_automation.id,
        v_automation.pocket_item_id,
        v_scheduled,
        'pending'
      )
      on conflict (automation_id, scheduled_for) do nothing
      returning id into v_occurrence_id;

      if v_occurrence_id is not null then
        insert into public.notifications (user_id, occurrence_id)
        values (v_user, v_occurrence_id);

        v_created_occurrences := v_created_occurrences + 1;
        v_created_notifications := v_created_notifications + 1;
      end if;

      v_scheduled := public.automation_next_schedule(
        v_scheduled,
        v_automation.frequency,
        v_automation.timezone,
        v_automation.start_date
      );

      v_batch := v_batch + 1;
    end loop;

    update public.automations
    set next_run_at = v_scheduled
    where id = v_automation.id;

    v_processed_automations := v_processed_automations + 1;
  end loop;

  return json_build_object(
    'created_occurrences', v_created_occurrences,
    'created_notifications', v_created_notifications,
    'processed_automations', v_processed_automations
  );
end;
$$;

revoke all on function public.rpc_process_due_automations(timestamptz) from public, anon;
grant execute on function public.rpc_process_due_automations(timestamptz) to authenticated;
