create unique index if not exists performance_records_exact_result_unique_idx
  on public.performance_records (user_id, record_kind, category, date, value)
  where record_kind <> 'control-test'
    and category is not null
    and date is not null
    and value is not null;
