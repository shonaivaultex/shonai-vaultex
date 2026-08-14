create table if not exists public.video_feedback_message_reads (
  message_id bigint not null references public.video_feedback_messages(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (message_id, user_id)
);

alter table public.video_feedback_message_reads enable row level security;
create policy "Members read own video feedback message reads" on public.video_feedback_message_reads for select to authenticated using (user_id = auth.uid());
create policy "Members mark own video feedback messages read" on public.video_feedback_message_reads for insert to authenticated
with check (user_id = auth.uid() and exists (
  select 1 from public.video_feedback_messages message
  join public.video_feedback_requests request on request.id = message.request_id
  where message.id = message_id and (request.user_id = auth.uid() or public.is_assigned_coach(request.user_id))
));

create or replace function public.get_video_feedback_push_targets(p_request_id bigint, p_sender_role text)
returns table(endpoint text, p256dh text, auth text, athlete_name text)
language sql security definer set search_path = public stable as $$
  with request_data as (
    select request.id, request.user_id, player.name, player.program_class
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
    where p_sender_role = 'athlete'
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
