alter table public.performance_records add column if not exists record_kind text;

update public.performance_records
set record_kind = case
  when category in ('100m', '200m', '400m', '800m', '1500m', '5000m', '100mH', '110mH', '400mH', '走幅跳', '三段跳', '走高跳', '棒高跳', '砲丸投', '円盤投', 'ハンマー投', 'やり投', '十種競技', '七種競技') then 'athletics'
  else 'control-test'
end
where record_kind is null;

alter table public.performance_records
  alter column record_kind set default 'control-test',
  alter column record_kind set not null,
  drop constraint if exists performance_records_record_kind_check,
  add constraint performance_records_record_kind_check check (record_kind in ('control-test', 'athletics', 'unofficial-athletics'));

create index if not exists performance_records_user_kind_date_idx on public.performance_records (user_id, record_kind, date desc);
