create or replace function public.get_club_performance_position(
  p_category text,
  p_record_kind text,
  p_year integer default null
)
returns table(rank integer, total integer, top_percent numeric)
language sql
security definer
set search_path = public
stable
as $$
  with caller as (
    select p.school
    from public.players p
    where p.user_id = auth.uid()
      and nullif(trim(p.school), '') is not null
    limit 1
  ),
  personal_bests as (
    select
      r.user_id,
      case
        when p_category in ('30m走', '50m走', '100m', '200m', '400m', '800m', '1500m', '5000m', '100mH', '110mH', '400mH') then min(r.value)
        else max(r.value)
      end as best_value
    from public.performance_records r
    join public.players p on p.user_id = r.user_id
    join caller c on trim(lower(p.school)) = trim(lower(c.school))
    where r.category = p_category
      and r.record_kind = p_record_kind
      and (p_year is null or extract(year from r.date)::integer = p_year)
    group by r.user_id
  ),
  ranked as (
    select
      user_id,
      rank() over (
        order by
          case when p_category in ('30m走', '50m走', '100m', '200m', '400m', '800m', '1500m', '5000m', '100mH', '110mH', '400mH') then best_value end asc nulls last,
          case when p_category not in ('30m走', '50m走', '100m', '200m', '400m', '800m', '1500m', '5000m', '100mH', '110mH', '400mH') then best_value end desc nulls last
      )::integer as position,
      count(*) over ()::integer as athlete_count
    from personal_bests
  )
  select
    position,
    athlete_count,
    round(position::numeric / athlete_count * 100, 1)
  from ranked
  where user_id = auth.uid()
    and athlete_count >= 5;
$$;

revoke all on function public.get_club_performance_position(text, text, integer) from public;
grant execute on function public.get_club_performance_position(text, text, integer) to authenticated;
