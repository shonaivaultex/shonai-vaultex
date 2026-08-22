-- Full official-record leaderboard for the authenticated ranking page.
-- Existing TOP 3 RPCs remain unchanged for backwards compatibility.
create or replace function public.get_official_ranking_page(
  p_category text,
  p_year integer default null,
  p_gender text default null,
  p_scope text default 'overall'
)
returns table(
  ranking_scope text,
  leaderboard_position integer,
  display_name text,
  best_value numeric,
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
  select user_id, program_class, gender
  from public.players
  where user_id = auth.uid()
    and member_status = 'active'
  limit 1
),
personal_bests as (
  select
    r.user_id,
    p.name,
    p.program_class,
    p.gender,
    p.ranking_name_public,
    case
      when p_category in ('30m走','Flying 30m','50m走','150m走','300m走','100m','200m','400m','800m','1500m','5000m','100mH','110mH','400mH') then min(r.value)
      else max(r.value)
    end as best_value
  from public.performance_records r
  join public.players p on p.user_id = r.user_id
  cross join caller c
  where r.category = p_category
    and r.record_kind = 'athletics'
    and (p_year is null or extract(year from r.date)::integer = p_year)
    and p.member_status = 'active'
    and p.gender = coalesce(p_gender, c.gender)
    and (p_scope = 'overall' or (p_scope = 'class' and c.program_class is not null and p.program_class = c.program_class))
  group by r.user_id, p.name, p.program_class, p.gender, p.ranking_name_public
),
ranked as (
  select
    pb.*,
    rank() over (
      order by
        case when p_category in ('30m走','Flying 30m','50m走','150m走','300m走','100m','200m','400m','800m','1500m','5000m','100mH','110mH','400mH') then best_value end asc nulls last,
        case when p_category not in ('30m走','Flying 30m','50m走','150m走','300m走','100m','200m','400m','800m','1500m','5000m','100mH','110mH','400mH') then best_value end desc nulls last
    )::integer as ranking_position,
    count(*) over ()::integer as ranking_total
  from personal_bests pb
)
select
  case when p_scope = 'class' then 'class' else 'overall' end,
  ranking_position,
  case
    when ranking_name_public or user_id = auth.uid() then name
    else coalesce(program_class, 'VAULTEX') || '会員'
  end,
  best_value,
  user_id = auth.uid(),
  ranking_total,
  ranked.program_class,
  ranked.gender
from ranked
where p_scope in ('overall', 'class')
  and p_gender in ('male', 'female')
order by ranking_position, best_value;
$$;

revoke all on function public.get_official_ranking_page(text, integer, text, text) from public, anon;
grant execute on function public.get_official_ranking_page(text, integer, text, text) to authenticated;
