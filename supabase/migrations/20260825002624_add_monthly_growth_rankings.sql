-- Monthly growth leaderboard based on each athlete's own month-over-month average.
-- At least three records in both months are required so one exceptional result
-- does not dominate the ranking.
create or replace function public.get_monthly_growth_rankings(
  p_category text,
  p_record_kind text,
  p_month date,
  p_gender text,
  p_scope text default 'overall'
)
returns table(
  ranking_scope text,
  leaderboard_position integer,
  display_name text,
  growth_percent numeric,
  previous_average numeric,
  current_average numeric,
  previous_count integer,
  current_count integer,
  is_current_user boolean,
  total_count integer,
  program_class text,
  gender text
)
language sql
security definer
set search_path = public
stable
as $$
with caller as (
  select user_id, program_class
  from public.players
  where user_id = auth.uid()
    and member_status = 'active'
  limit 1
),
bounds as (
  select
    date_trunc('month', p_month::timestamp)::date as current_start,
    (date_trunc('month', p_month::timestamp) + interval '1 month')::date as current_end,
    (date_trunc('month', p_month::timestamp) - interval '1 month')::date as previous_start
),
athlete_months as (
  select
    r.user_id,
    p.name,
    p.program_class,
    p.gender,
    p.ranking_name_public,
    avg(r.value) filter (where r.date >= b.previous_start and r.date < b.current_start) as previous_average,
    avg(r.value) filter (where r.date >= b.current_start and r.date < b.current_end) as current_average,
    count(*) filter (where r.date >= b.previous_start and r.date < b.current_start)::integer as previous_count,
    count(*) filter (where r.date >= b.current_start and r.date < b.current_end)::integer as current_count
  from public.performance_records r
  join public.players p on p.user_id = r.user_id
  cross join caller c
  cross join bounds b
  where r.category = p_category
    and r.record_kind = p_record_kind
    and r.date >= b.previous_start
    and r.date < b.current_end
    and p.member_status = 'active'
    and p.gender = p_gender
    and (
      p_scope = 'overall'
      or (p_scope = 'class' and c.program_class is not null and p.program_class = c.program_class)
    )
  group by r.user_id, p.name, p.program_class, p.gender, p.ranking_name_public
),
eligible as (
  select
    athlete_months.*,
    case
      when previous_average = 0 then 0
      when p_category in ('30m走','Flying 30m','50m走','150m走','300m走','100m','200m','400m','800m','1500m','5000m','100mH','110mH','400mH')
        then ((previous_average - current_average) / abs(previous_average)) * 100
      else ((current_average - previous_average) / abs(previous_average)) * 100
    end as growth_percent
  from athlete_months
  where previous_count >= 3
    and current_count >= 3
    and previous_average is not null
    and current_average is not null
),
ranked as (
  select
    eligible.*,
    rank() over (order by growth_percent desc)::integer as ranking_position,
    count(*) over ()::integer as ranking_total
  from eligible
)
select
  case when p_scope = 'class' then 'class' else 'overall' end,
  ranking_position,
  case
    when ranking_name_public or user_id = auth.uid() then name
    else coalesce(program_class, 'VAULTEX') || '会員'
  end,
  round(growth_percent, 2),
  round(previous_average, 3),
  round(current_average, 3),
  previous_count,
  current_count,
  user_id = auth.uid(),
  ranking_total,
  ranked.program_class,
  ranked.gender
from ranked
where auth.uid() is not null
  and p_scope in ('overall', 'class')
  and p_gender in ('male', 'female')
  and p_record_kind in ('athletics', 'unofficial-athletics', 'control-test')
order by ranking_position, name;
$$;

revoke all on function public.get_monthly_growth_rankings(text, text, date, text, text) from public, anon;
grant execute on function public.get_monthly_growth_rankings(text, text, date, text, text) to authenticated;
