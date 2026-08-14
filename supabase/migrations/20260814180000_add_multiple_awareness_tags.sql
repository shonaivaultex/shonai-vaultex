alter table public.performance_records
add column if not exists awareness_categories text[];

update public.performance_records
set awareness_categories = array[awareness_category]
where awareness_category is not null
  and (awareness_categories is null or cardinality(awareness_categories) = 0);

alter table public.performance_records
drop constraint if exists performance_records_awareness_categories_check;

alter table public.performance_records
add constraint performance_records_awareness_categories_check
check (
  awareness_categories is null or awareness_categories <@ array[
    'リズム', '力感', 'スタート', '動作', '気持ち', '感覚', 'その他'
  ]::text[]
);
