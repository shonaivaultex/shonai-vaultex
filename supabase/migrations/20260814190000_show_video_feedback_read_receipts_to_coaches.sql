drop policy if exists "Members read own video feedback message reads" on public.video_feedback_message_reads;
drop policy if exists "Participants read video feedback message reads" on public.video_feedback_message_reads;

create policy "Participants read video feedback message reads"
on public.video_feedback_message_reads for select to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.video_feedback_messages message
    join public.video_feedback_requests request on request.id = message.request_id
    where message.id = message_id
      and request.user_id = video_feedback_message_reads.user_id
      and public.is_assigned_coach(request.user_id)
  )
);
