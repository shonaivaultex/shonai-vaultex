alter table public.video_feedback_messages
  add column if not exists attachment_path text,
  add column if not exists attachment_type text,
  add column if not exists attachment_name text,
  add column if not exists attachment_size bigint;

alter table public.video_feedback_messages alter column body drop not null;
alter table public.video_feedback_messages drop constraint if exists video_feedback_messages_body_check;
alter table public.video_feedback_messages drop constraint if exists video_feedback_messages_attachment_type_check;
alter table public.video_feedback_messages drop constraint if exists video_feedback_messages_content_check;
alter table public.video_feedback_messages
  add constraint video_feedback_messages_body_check check (body is null or char_length(body) between 1 and 1000),
  add constraint video_feedback_messages_attachment_type_check check (attachment_type is null or attachment_type in ('image', 'video')),
  add constraint video_feedback_messages_content_check check (
    body is not null or (attachment_path is not null and attachment_type is not null)
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'feedback-attachments',
  'feedback-attachments',
  false,
  104857600,
  array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Participants read feedback attachments" on storage.objects;
create policy "Participants read feedback attachments"
on storage.objects for select to authenticated
using (
  bucket_id = 'feedback-attachments' and exists (
    select 1 from public.video_feedback_requests request
    where request.id::text = (storage.foldername(name))[1]
      and (request.user_id = auth.uid() or public.is_assigned_coach(request.user_id))
  )
);

drop policy if exists "Participants upload feedback attachments" on storage.objects;
create policy "Participants upload feedback attachments"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'feedback-attachments'
  and (storage.foldername(name))[2] = auth.uid()::text
  and exists (
    select 1 from public.video_feedback_requests request
    where request.id::text = (storage.foldername(name))[1]
      and (request.user_id = auth.uid() or public.is_assigned_coach(request.user_id))
  )
);

drop policy if exists "Senders delete own feedback attachments" on storage.objects;
create policy "Senders delete own feedback attachments"
on storage.objects for delete to authenticated
using (
  bucket_id = 'feedback-attachments' and (storage.foldername(name))[2] = auth.uid()::text
);
