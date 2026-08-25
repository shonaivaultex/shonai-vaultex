-- Optional, event-specific details for bar and combined events.
-- Existing rows remain unchanged and continue to use the representative value.
alter table public.performance_records
  add column if not exists advanced_details jsonb;

comment on column public.performance_records.advanced_details is
  'Optional structured details for bar attempts or combined-event results. The representative value remains in value.';

alter table public.performance_records
  drop constraint if exists performance_records_advanced_details_shape_check;

alter table public.performance_records
  add constraint performance_records_advanced_details_shape_check
  check (
    advanced_details is null
    or advanced_details->>'type' in ('bar', 'combined')
  );
