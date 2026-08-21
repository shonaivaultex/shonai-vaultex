create table if not exists public.calendar_feed_tokens (
  user_id uuid primary key references auth.users(id) on delete cascade,
  token uuid not null default gen_random_uuid() unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.calendar_feed_tokens enable row level security;

drop policy if exists "Members read own calendar feed token" on public.calendar_feed_tokens;
create policy "Members read own calendar feed token"
on public.calendar_feed_tokens for select to authenticated
using (user_id = auth.uid());

drop policy if exists "Members create own calendar feed token" on public.calendar_feed_tokens;
create policy "Members create own calendar feed token"
on public.calendar_feed_tokens for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists "Members rotate own calendar feed token" on public.calendar_feed_tokens;
create policy "Members rotate own calendar feed token"
on public.calendar_feed_tokens for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

grant select, insert, update on public.calendar_feed_tokens to authenticated;

