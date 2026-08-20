alter table public.personal_calendar_goals
  add column if not exists schedule_id bigint references public.schedules(id) on delete set null,
  add column if not exists calendar_entry_id bigint references public.personal_calendar_entries(id) on delete set null,
  add column if not exists outcome text
    check (outcome in ('achieved', 'not_achieved', 'no_entry', 'changed')),
  add column if not exists result_value numeric,
  add column if not exists result_unit text,
  add column if not exists reflection text,
  add column if not exists next_action text
    check (next_action in ('continue', 'new_goal'));
