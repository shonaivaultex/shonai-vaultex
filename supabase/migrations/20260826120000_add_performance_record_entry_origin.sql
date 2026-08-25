alter table public.performance_records
  add column if not exists entry_source text not null default 'athlete',
  add column if not exists entered_by uuid references auth.users(id) on delete set null;

alter table public.performance_records
  drop constraint if exists performance_records_entry_source_check;

alter table public.performance_records
  add constraint performance_records_entry_source_check
  check (entry_source in ('athlete', 'coach', 'system'));

comment on column public.performance_records.entry_source is
  'Origin of the record. Existing and direct member records are treated as athlete records.';

comment on column public.performance_records.entered_by is
  'Authenticated user who entered the record when it was entered on behalf of an athlete.';

create index if not exists performance_records_entry_source_idx
  on public.performance_records (user_id, entry_source, date desc);
