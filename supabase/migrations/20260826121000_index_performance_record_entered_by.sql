create index if not exists performance_records_entered_by_idx
  on public.performance_records (entered_by)
  where entered_by is not null;
