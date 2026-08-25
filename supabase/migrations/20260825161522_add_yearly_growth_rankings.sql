-- Rolling one-year growth leaderboard. Athletes need two records for the same event.
create or replace function public.get_yearly_growth_rankings(
  p_category text,
  p_record_kind text,
  p_as_of date,
  p_gender text,
  p_scope text default 'overall'
)
returns table(
  ranking_scope text,
  leaderboard_position integer,
  display_name text,
  growth_percent numeric,
  starting_value numeric,
  latest_value numeric,
  starting_date date,
  latest_date date,
  record_count integer,
  is_current_user boolean,
  total_count integer,
  program_class text,
  gender text
)
language sql
security definer
set search_path = ''
stable
as $$
with caller as (
  select user_id, program_class
  from public.players
  where user_id = (select auth.uid()) and member_status = 'active'
  limit 1
),
eligible_records as (
  select r.id, r.user_id, r.value, r.date, p.name, p.program_class,
    p.gender, p.ranking_name_public
  from public.performance_records r
  join public.players p on p.user_id = r.user_id
  cross join caller c
  where r.category = p_category
    and r.record_kind = p_record_kind
    and r.date >= (p_as_of - interval '1 year')::date
    and r.date <= p_as_of
    and public.is_performance_wind_legal(r.category, r.wind_speed)
    and p.member_status = 'active'
    and p.gender = p_gender
    and (p_scope = 'overall' or (p_scope = 'class' and c.program_class is not null and p.program_class = c.program_class))
),
athlete_summary as (
  select user_id, min(name) as name, min(program_class) as program_class,
    min(gender) as gender, bool_or(ranking_name_public) as ranking_name_public,
    count(*)::integer as record_count
  from eligible_records
  group by user_id
  having count(*) >= 2
),
first_records as (
  select distinct on (user_id) user_id, value as starting_value, date as starting_date
  from eligible_records
  order by user_id, date asc, id asc
),
latest_records as (
  select distinct on (user_id) user_id, value as latest_value, date as latest_date
  from eligible_records
  order by user_id, date desc, id desc
),
growth as (
  select s.*, f.starting_value, f.starting_date, l.latest_value, l.latest_date,
    case
      when f.starting_value = 0 then 0
      when p_category in ('30m走','Flying 30m','50m走','150m走','300m走','100m','200m','400m','800m','1500m','5000m','100mH','110mH','400mH')
        then ((f.starting_value - l.latest_value) / abs(f.starting_value)) * 100
      else ((l.latest_value - f.starting_value) / abs(f.starting_value)) * 100
    end as growth_percent
  from athlete_summary s
  join first_records f using (user_id)
  join latest_records l using (user_id)
),
ranked as (
  select growth.*, rank() over (order by growth_percent desc)::integer as ranking_position,
    count(*) over ()::integer as ranking_total
  from growth
)
select
  case when p_scope = 'class' then 'class' else 'overall' end,
  ranking_position,
  case when ranking_name_public or user_id = (select auth.uid()) then name
    else coalesce(program_class, 'VAULTEX') || '会員' end,
  round(growth_percent, 2), round(starting_value, 3), round(latest_value, 3),
  starting_date, latest_date, record_count, user_id = (select auth.uid()),
  ranking_total, ranked.program_class, ranked.gender
from ranked
where (select auth.uid()) is not null
  and p_scope in ('overall', 'class')
  and p_gender in ('male', 'female')
  and p_record_kind in ('athletics', 'unofficial-athletics', 'control-test')
order by ranking_position, name;
$$;

revoke all on function public.get_yearly_growth_rankings(text, text, date, text, text) from public, anon;
grant execute on function public.get_yearly_growth_rankings(text, text, date, text, text) to authenticated;
