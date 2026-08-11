alter table public.players
  add column if not exists ranking_name_public boolean not null default false;

create or replace function public.get_performance_leaderboard(
  p_category text,
  p_record_kind text,
  p_year integer default null
)
returns table(
  ranking_scope text,
  leaderboard_position integer,
  display_name text,
  best_value numeric,
  is_current_user boolean
)
language sql
security definer
set search_path = public
stable
as $$
  with caller as (
    select program_class
    from public.players
    where user_id = auth.uid()
    limit 1
  ),
  personal_bests as (
    select
      r.user_id,
      p.name,
      p.program_class,
      p.ranking_name_public,
      case
        when p_category in ('30m走', '50m走', '100m', '200m', '400m', '800m', '1500m', '5000m', '100mH', '110mH', '400mH') then min(r.value)
        else max(r.value)
      end as best_value
    from public.performance_records r
    join public.players p on p.user_id = r.user_id
    where r.category = p_category
      and r.record_kind = p_record_kind
      and (p_year is null or extract(year from r.date)::integer = p_year)
    group by r.user_id, p.name, p.program_class, p.ranking_name_public
  ),
  overall_ranked as (
    select *, rank() over (order by
      case when p_category in ('30m走', '50m走', '100m', '200m', '400m', '800m', '1500m', '5000m', '100mH', '110mH', '400mH') then best_value end asc nulls last,
      case when p_category not in ('30m走', '50m走', '100m', '200m', '400m', '800m', '1500m', '5000m', '100mH', '110mH', '400mH') then best_value end desc nulls last
    )::integer as ranking_position
    from personal_bests
  ),
  class_ranked as (
    select pb.*, rank() over (order by
      case when p_category in ('30m走', '50m走', '100m', '200m', '400m', '800m', '1500m', '5000m', '100mH', '110mH', '400mH') then best_value end asc nulls last,
      case when p_category not in ('30m走', '50m走', '100m', '200m', '400m', '800m', '1500m', '5000m', '100mH', '110mH', '400mH') then best_value end desc nulls last
    )::integer as ranking_position
    from personal_bests pb
    cross join caller c
    where c.program_class is not null and pb.program_class = c.program_class
  )
  select 'overall', ranking_position,
    case when ranking_name_public or user_id = auth.uid() then name else coalesce(program_class, 'VAULTEX') || '会員' end,
    best_value, user_id = auth.uid()
  from overall_ranked where ranking_position <= 3
  union all
  select 'class', ranking_position,
    case when ranking_name_public or user_id = auth.uid() then name else coalesce(program_class, 'VAULTEX') || '会員' end,
    best_value, user_id = auth.uid()
  from class_ranked where ranking_position <= 3
  order by 1, 2;
$$;

revoke all on function public.get_performance_leaderboard(text, text, integer) from public;
grant execute on function public.get_performance_leaderboard(text, text, integer) to authenticated;
