alter table public.push_subscriptions
  add column if not exists notify_coach_records boolean not null default true;
