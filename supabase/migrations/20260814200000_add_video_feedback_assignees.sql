alter table public.video_feedback_requests
  add column if not exists assigned_coach_id uuid references auth.users(id) on delete set null,
  add column if not exists assigned_at timestamptz;

create index if not exists video_feedback_requests_assigned_coach_idx
on public.video_feedback_requests (assigned_coach_id);

create or replace function public.get_video_feedback_coaches(p_request_id bigint)
returns table(user_id uuid, name text)
language sql security definer set search_path = public stable as $$
  select distinct coach.user_id, coach.name
  from public.video_feedback_requests request
  join public.players athlete on athlete.user_id = request.user_id
  join public.coach_class_assignments assignment on assignment.program_class = athlete.program_class
  join public.user_roles role on role.user_id = assignment.coach_id and role.role = 'coach'
  join public.players coach on coach.user_id = assignment.coach_id
  where request.id = p_request_id
    and (request.user_id = auth.uid() or public.is_assigned_coach(request.user_id))
  order by coach.name;
$$;
revoke all on function public.get_video_feedback_coaches(bigint) from public;
grant execute on function public.get_video_feedback_coaches(bigint) to authenticated;

create or replace function public.set_video_feedback_assignee(p_request_id bigint, p_coach_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  athlete_id uuid;
  athlete_class text;
begin
  select request.user_id, athlete.program_class into athlete_id, athlete_class
  from public.video_feedback_requests request
  join public.players athlete on athlete.user_id = request.user_id
  where request.id = p_request_id;

  if athlete_id is null or not public.is_assigned_coach(athlete_id) then
    raise exception '担当権限がありません';
  end if;

  if p_coach_id is not null and not exists (
    select 1 from public.user_roles role
    join public.coach_class_assignments assignment on assignment.coach_id = role.user_id
    where role.user_id = p_coach_id and role.role = 'coach' and assignment.program_class = athlete_class
  ) then
    raise exception 'このクラスを担当するコーチではありません';
  end if;

  update public.video_feedback_requests
  set assigned_coach_id = p_coach_id,
      assigned_at = case when p_coach_id is null then null else now() end
  where id = p_request_id;
end;
$$;
revoke all on function public.set_video_feedback_assignee(bigint, uuid) from public;
grant execute on function public.set_video_feedback_assignee(bigint, uuid) to authenticated;

create or replace function public.sync_video_feedback_conversation_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.sender_role = 'coach' then
    update public.video_feedback_requests
    set status = 'answered', response = new.body, responded_by = new.sender_id, responded_at = new.created_at,
        assigned_coach_id = coalesce(assigned_coach_id, new.sender_id),
        assigned_at = coalesce(assigned_at, new.created_at)
    where id = new.request_id;
  else
    update public.video_feedback_requests set status = 'pending' where id = new.request_id;
  end if;
  return new;
end; $$;

create or replace function public.get_video_feedback_push_targets(p_request_id bigint, p_sender_role text)
returns table(endpoint text, p256dh text, auth text, athlete_name text)
language sql security definer set search_path = public stable as $$
  with request_data as (
    select request.id, request.user_id, request.assigned_coach_id, player.name, player.program_class
    from public.video_feedback_requests request
    join public.players player on player.user_id = request.user_id
    where request.id = p_request_id and (
      (p_sender_role = 'athlete' and request.user_id = auth.uid())
      or (p_sender_role = 'coach' and public.is_assigned_coach(request.user_id))
    )
  ), targets as (
    select assignment.coach_id as user_id from request_data request
    join public.coach_class_assignments assignment on assignment.program_class = request.program_class
    join public.user_roles role on role.user_id = assignment.coach_id and role.role = 'coach'
    where p_sender_role = 'athlete' and request.assigned_coach_id is null
    union
    select request.assigned_coach_id from request_data request
    where p_sender_role = 'athlete' and request.assigned_coach_id is not null
    union
    select request.user_id from request_data request where p_sender_role = 'coach'
  )
  select distinct subscription.endpoint, subscription.p256dh, subscription.auth, request.name
  from request_data request join targets target on true
  join public.push_subscriptions subscription on subscription.user_id = target.user_id
  where subscription.notify_feedback;
$$;
revoke all on function public.get_video_feedback_push_targets(bigint, text) from public;
grant execute on function public.get_video_feedback_push_targets(bigint, text) to authenticated;

create or replace function public.answer_video_feedback_on_coach_reaction()
returns trigger language plpgsql security definer set search_path = public as $$
declare athlete_id uuid;
begin
  select request.user_id into athlete_id
  from public.video_feedback_messages message
  join public.video_feedback_requests request on request.id = message.request_id
  where message.id = new.message_id;
  if athlete_id is not null
    and exists (select 1 from public.user_roles where user_id = new.user_id and role = 'coach')
    and public.is_assigned_coach(athlete_id)
  then
    update public.video_feedback_requests request
    set status = 'answered', responded_by = new.user_id, responded_at = now(),
        assigned_coach_id = coalesce(assigned_coach_id, new.user_id),
        assigned_at = coalesce(assigned_at, now())
    from public.video_feedback_messages message
    where message.id = new.message_id and request.id = message.request_id;
  end if;
  return new;
end;
$$;
