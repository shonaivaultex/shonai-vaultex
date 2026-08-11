alter table public.coach_feedback add column if not exists acknowledged_at timestamptz;

create or replace function public.acknowledge_coach_feedback(p_feedback_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.coach_feedback f
  set acknowledged_at = coalesce(f.acknowledged_at, now())
  where f.id = p_feedback_id
    and exists (
      select 1 from public.performance_records r
      where r.id = f.record_id and r.user_id = auth.uid()
    );

  if not found then
    raise exception 'Feedback not found or access denied';
  end if;
end;
$$;

revoke all on function public.acknowledge_coach_feedback(bigint) from public;
grant execute on function public.acknowledge_coach_feedback(bigint) to authenticated;
