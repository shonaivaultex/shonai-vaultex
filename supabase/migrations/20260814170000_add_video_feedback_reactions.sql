create table if not exists public.video_feedback_message_reactions (
  message_id bigint not null references public.video_feedback_messages(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reaction text not null check (reaction in ('👍', '🔥', '💡', '✅')),
  created_at timestamptz not null default now(),
  primary key (message_id, user_id)
);

create index if not exists video_feedback_message_reactions_message_idx
on public.video_feedback_message_reactions (message_id);

alter table public.video_feedback_message_reactions enable row level security;

create policy "Participants read video feedback reactions"
on public.video_feedback_message_reactions for select to authenticated
using (
  exists (
    select 1
    from public.video_feedback_messages message
    join public.video_feedback_requests request on request.id = message.request_id
    where message.id = message_id
      and (request.user_id = auth.uid() or public.is_assigned_coach(request.user_id))
  )
);

create policy "Participants add video feedback reactions"
on public.video_feedback_message_reactions for insert to authenticated
with check (
  user_id = auth.uid() and exists (
    select 1
    from public.video_feedback_messages message
    join public.video_feedback_requests request on request.id = message.request_id
    where message.id = message_id
      and (request.user_id = auth.uid() or public.is_assigned_coach(request.user_id))
  )
);

create policy "Participants change video feedback reactions"
on public.video_feedback_message_reactions for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Participants remove video feedback reactions"
on public.video_feedback_message_reactions for delete to authenticated
using (user_id = auth.uid());
