alter table public.performance_records
  add column if not exists awareness_category text,
  add column if not exists awareness_note text,
  add column if not exists video_path text;

alter table public.performance_records
  drop constraint if exists performance_records_awareness_category_check,
  add constraint performance_records_awareness_category_check
    check (
      awareness_category is null or awareness_category in
      ('リズム', '力感', 'スタート', '動作', '気持ち', '感覚', 'その他')
    ),
  drop constraint if exists performance_records_awareness_note_length_check,
  add constraint performance_records_awareness_note_length_check
    check (awareness_note is null or char_length(awareness_note) <= 200);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'performance-videos',
  'performance-videos',
  false,
  104857600,
  array['video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can read their own performance videos" on storage.objects;
create policy "Users can read their own performance videos"
on storage.objects for select to authenticated
using (bucket_id = 'performance-videos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can upload their own performance videos" on storage.objects;
create policy "Users can upload their own performance videos"
on storage.objects for insert to authenticated
with check (bucket_id = 'performance-videos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can update their own performance videos" on storage.objects;
create policy "Users can update their own performance videos"
on storage.objects for update to authenticated
using (bucket_id = 'performance-videos' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'performance-videos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can delete their own performance videos" on storage.objects;
create policy "Users can delete their own performance videos"
on storage.objects for delete to authenticated
using (bucket_id = 'performance-videos' and (storage.foldername(name))[1] = auth.uid()::text);
