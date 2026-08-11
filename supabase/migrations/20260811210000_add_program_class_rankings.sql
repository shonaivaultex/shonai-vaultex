alter table public.players add column if not exists program_class text;

alter table public.players
  drop constraint if exists players_program_class_check,
  add constraint players_program_class_check
    check (program_class is null or program_class in ('ジュニア', 'ユース', 'エリート', 'マスターズ'));

create or replace function public.get_performance_rankings(
  p_category text,
  p_record_kind text,
  p_year integer default null
)
returns table(
  overall_rank integer,
  overall_total integer,
  overall_top_percent numeric,
  class_rank integer,
  class_total integer,
  class_top_percent numeric,
  program_class text
)
language sql
security definer
set search_path = public
stable
as $$
  with personal_bests as (
    select
      r.user_id,
      p.program_class,
      case
        when p_category in ('30m走', '50m走', '100m', '200m', '400m', '800m', '1500m', '5000m', '100mH', '110mH', '400mH') then min(r.value)
        else max(r.value)
      end as best_value
    from public.performance_records r
    join public.players p on p.user_id = r.user_id
    where r.category = p_category
      and r.record_kind = p_record_kind
      and (p_year is null or extract(year from r.date)::integer = p_year)
    group by r.user_id, p.program_class
  ),
  ranked as (
    select
      user_id,
      program_class,
      rank() over (order by
        case when p_category in ('30m走', '50m走', '100m', '200m', '400m', '800m', '1500m', '5000m', '100mH', '110mH', '400mH') then best_value end asc nulls last,
        case when p_category not in ('30m走', '50m走', '100m', '200m', '400m', '800m', '1500m', '5000m', '100mH', '110mH', '400mH') then best_value end desc nulls last
      )::integer as overall_position,
      count(*) over ()::integer as overall_count,
      case when program_class is not null then rank() over (partition by program_class order by
        case when p_category in ('30m走', '50m走', '100m', '200m', '400m', '800m', '1500m', '5000m', '100mH', '110mH', '400mH') then best_value end asc nulls last,
        case when p_category not in ('30m走', '50m走', '100m', '200m', '400m', '800m', '1500m', '5000m', '100mH', '110mH', '400mH') then best_value end desc nulls last
      )::integer end as class_position,
      case when program_class is not null then count(*) over (partition by program_class)::integer end as class_count
    from personal_bests
  )
  select
    overall_position,
    overall_count,
    round(overall_position::numeric / overall_count * 100, 1),
    class_position,
    class_count,
    case when class_count > 0 then round(class_position::numeric / class_count * 100, 1) end,
    ranked.program_class
  from ranked
  where user_id = auth.uid();
$$;

revoke all on function public.get_performance_rankings(text, text, integer) from public;
grant execute on function public.get_performance_rankings(text, text, integer) to authenticated;
