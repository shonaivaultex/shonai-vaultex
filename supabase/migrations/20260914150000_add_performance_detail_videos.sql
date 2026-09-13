alter table public.performance_record_details
  add column if not exists video_path text;

drop policy if exists "Record participants can read linked performance videos" on storage.objects;

create policy "Record participants can read linked performance videos"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'performance-videos'
  and (
    exists (
      select 1 from public.performance_records record
      where record.video_path = name
        and (record.user_id = auth.uid() or public.is_assigned_coach(record.user_id))
    )
    or exists (
      select 1
      from public.performance_record_details detail
      join public.performance_records record on record.id = detail.performance_record_id
      where detail.video_path = name
        and (record.user_id = auth.uid() or public.is_assigned_coach(record.user_id))
    )
  )
);
