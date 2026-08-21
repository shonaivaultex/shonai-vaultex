alter table public.announcements
  add column if not exists is_public boolean not null default false;

create index if not exists announcements_public_created_at_idx
  on public.announcements (created_at desc)
  where is_public = true;

alter table public.announcements enable row level security;

grant select on table public.announcements to anon, authenticated;

drop policy if exists "Published announcements are publicly readable" on public.announcements;
create policy "Published announcements are publicly readable"
on public.announcements
for select
to anon, authenticated
using (is_public = true);
