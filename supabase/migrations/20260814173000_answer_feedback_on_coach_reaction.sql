create or replace function public.answer_video_feedback_on_coach_reaction()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  athlete_id uuid;
begin
  select request.user_id
  into athlete_id
  from public.video_feedback_messages message
  join public.video_feedback_requests request on request.id = message.request_id
  where message.id = new.message_id;

  if athlete_id is not null
    and exists (
      select 1 from public.user_roles
      where user_id = new.user_id and role = 'coach'
    )
    and public.is_assigned_coach(athlete_id)
  then
    update public.video_feedback_requests request
    set status = 'answered',
        responded_by = new.user_id,
        responded_at = now()
    from public.video_feedback_messages message
    where message.id = new.message_id
      and request.id = message.request_id;
  end if;

  return new;
end;
$$;

drop trigger if exists answer_video_feedback_on_coach_reaction_trigger
on public.video_feedback_message_reactions;

create trigger answer_video_feedback_on_coach_reaction_trigger
after insert or update on public.video_feedback_message_reactions
for each row execute function public.answer_video_feedback_on_coach_reaction();
