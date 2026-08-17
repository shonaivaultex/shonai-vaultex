create index if not exists players_program_class_status_name_idx
on public.players (program_class, member_status, name);

create index if not exists feedback_requests_status_priority_created_idx
on public.feedback_requests (status, priority, created_at desc);

create index if not exists video_feedback_requests_status_priority_created_idx
on public.video_feedback_requests (status, priority, created_at desc);

create index if not exists video_feedback_requests_coach_status_created_idx
on public.video_feedback_requests (assigned_coach_id, status, created_at desc);

create or replace function public.coach_athlete_class_counts()
returns table(program_class text, athlete_count bigint)
language sql security invoker stable set search_path = public as $$
  select p.program_class, count(*)::bigint
  from public.players p
  join public.coach_class_assignments a
    on a.program_class = p.program_class and a.coach_id = auth.uid()
  where p.member_status = 'active'
  group by p.program_class
  order by case p.program_class
    when 'ジュニア' then 1 when 'ユース' then 2
    when 'エリート' then 3 when 'マスターズ' then 4 else 5 end;
$$;

revoke all on function public.coach_athlete_class_counts() from public;
grant execute on function public.coach_athlete_class_counts() to authenticated;

create or replace function public.coach_feedback_queue(
  p_status text default 'pending',
  p_program_class text default null,
  p_priority text default null,
  p_sort text default 'oldest',
  p_limit integer default 10,
  p_offset integer default 0
)
returns table(
  source text, request_id bigint, record_id bigint, athlete_id uuid,
  athlete_name text, program_class text, category text, record_value text,
  request_type text, message text, priority text, status text,
  created_at timestamptz, answered_at timestamptz, total_count bigint
)
language sql security invoker stable set search_path = public as $$
  with queue as (
    select 'record'::text as source, fr.id as request_id, fr.record_id,
      r.user_id as athlete_id, p.name as athlete_name, p.program_class,
      r.category, r.value::text as record_value, fr.request_type, fr.message,
      fr.priority, fr.status, fr.created_at, fr.answered_at
    from public.feedback_requests fr
    join public.performance_records r on r.id = fr.record_id
    join public.players p on p.user_id = r.user_id
    where public.is_assigned_coach(r.user_id)
    union all
    select 'video'::text, vr.id, null::bigint, vr.user_id, p.name,
      p.program_class, vr.event_name, ''::text, 'video'::text, vr.message,
      vr.priority, vr.status, vr.created_at, vr.responded_at
    from public.video_feedback_requests vr
    join public.players p on p.user_id = vr.user_id
    where public.is_assigned_coach(vr.user_id)
      and (vr.assigned_coach_id is null or vr.assigned_coach_id = auth.uid())
  ), filtered as (
    select * from queue q
    where q.status = p_status
      and (p_program_class is null or q.program_class = p_program_class)
      and (p_priority is null or q.priority = p_priority)
  )
  select f.*, count(*) over()::bigint as total_count
  from filtered f
  order by
    case when p_status = 'pending' and f.priority = 'urgent' then 0 else 1 end,
    case when p_sort = 'oldest' then f.created_at end asc,
    case when p_sort = 'newest' then f.created_at end desc
  limit greatest(1, least(p_limit, 50))
  offset greatest(p_offset, 0);
$$;

revoke all on function public.coach_feedback_queue(text, text, text, text, integer, integer) from public;
grant execute on function public.coach_feedback_queue(text, text, text, text, integer, integer) to authenticated;
