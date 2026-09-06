create table public.line_daily_reminder_deliveries (
  user_id uuid not null references auth.users(id) on delete cascade,
  reminder_date date not null,
  reminder_kind text not null check (reminder_kind in ('tomorrow_schedule')),
  created_at timestamptz not null default now(),
  primary key (user_id, reminder_date, reminder_kind)
);

alter table public.line_daily_reminder_deliveries enable row level security;
revoke all on table public.line_daily_reminder_deliveries from anon, authenticated;
