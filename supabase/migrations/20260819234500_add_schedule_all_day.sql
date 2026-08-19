alter table public.schedules
  add column if not exists all_day boolean not null default false;

comment on column public.schedules.all_day is
  'True when the schedule is date-based and should be displayed as an all-day event.';
