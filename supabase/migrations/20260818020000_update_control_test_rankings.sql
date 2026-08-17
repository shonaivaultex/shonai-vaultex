create or replace function public.get_performance_rankings(p_category text, p_record_kind text, p_year integer default null)
returns table(overall_rank integer, overall_total integer, overall_top_percent numeric, class_rank integer, class_total integer, class_top_percent numeric, program_class text, gender text)
language sql security definer set search_path = public stable as $$
  with caller as (
    select p.program_class, p.gender from public.players p where p.user_id = auth.uid() and p.member_status = 'active' limit 1
  ), personal_bests as (
    select r.user_id, p.program_class, p.gender,
      case when p_category in ('30m走','50m走','300m走','100m','200m','400m','800m','1500m','5000m','100mH','110mH','400mH') then min(r.value) else max(r.value) end as best_value
    from public.performance_records r join public.players p on p.user_id = r.user_id cross join caller c
    where r.category = p_category and r.record_kind = p_record_kind and (p_year is null or extract(year from r.date)::integer = p_year)
      and c.gender is not null and p.gender = c.gender and p.member_status = 'active'
    group by r.user_id, p.program_class, p.gender
  ), ranked as (
    select user_id, program_class, gender,
      rank() over (order by
        case when p_category in ('30m走','50m走','300m走','100m','200m','400m','800m','1500m','5000m','100mH','110mH','400mH') then best_value end asc nulls last,
        case when p_category not in ('30m走','50m走','300m走','100m','200m','400m','800m','1500m','5000m','100mH','110mH','400mH') then best_value end desc nulls last)::integer as overall_position,
      count(*) over ()::integer as overall_count,
      case when program_class is not null then rank() over (partition by program_class order by
        case when p_category in ('30m走','50m走','300m走','100m','200m','400m','800m','1500m','5000m','100mH','110mH','400mH') then best_value end asc nulls last,
        case when p_category not in ('30m走','50m走','300m走','100m','200m','400m','800m','1500m','5000m','100mH','110mH','400mH') then best_value end desc nulls last)::integer end as class_position,
      case when program_class is not null then count(*) over (partition by program_class)::integer end as class_count
    from personal_bests
  )
  select overall_position, overall_count, round(overall_position::numeric / overall_count * 100, 1), class_position, class_count,
    case when class_count > 0 then round(class_position::numeric / class_count * 100, 1) end, ranked.program_class, ranked.gender
  from ranked where user_id = auth.uid();
$$;

create or replace function public.get_performance_leaderboard(p_category text, p_record_kind text, p_year integer default null)
returns table(ranking_scope text, leaderboard_position integer, display_name text, best_value numeric, is_current_user boolean)
language sql security definer set search_path = public stable as $$
  with caller as (
    select program_class, gender from public.players where user_id = auth.uid() and member_status = 'active' limit 1
  ), personal_bests as (
    select r.user_id, p.name, p.program_class, p.ranking_name_public,
      case when p_category in ('30m走','50m走','300m走','100m','200m','400m','800m','1500m','5000m','100mH','110mH','400mH') then min(r.value) else max(r.value) end as best_value
    from public.performance_records r join public.players p on p.user_id = r.user_id cross join caller c
    where r.category = p_category and r.record_kind = p_record_kind and (p_year is null or extract(year from r.date)::integer = p_year)
      and c.gender is not null and p.gender = c.gender and p.member_status = 'active'
    group by r.user_id, p.name, p.program_class, p.ranking_name_public
  ), overall_ranked as (
    select *, rank() over (order by
      case when p_category in ('30m走','50m走','300m走','100m','200m','400m','800m','1500m','5000m','100mH','110mH','400mH') then best_value end asc nulls last,
      case when p_category not in ('30m走','50m走','300m走','100m','200m','400m','800m','1500m','5000m','100mH','110mH','400mH') then best_value end desc nulls last)::integer as ranking_position from personal_bests
  ), class_ranked as (
    select pb.*, rank() over (order by
      case when p_category in ('30m走','50m走','300m走','100m','200m','400m','800m','1500m','5000m','100mH','110mH','400mH') then best_value end asc nulls last,
      case when p_category not in ('30m走','50m走','300m走','100m','200m','400m','800m','1500m','5000m','100mH','110mH','400mH') then best_value end desc nulls last)::integer as ranking_position
    from personal_bests pb cross join caller c where c.program_class is not null and pb.program_class = c.program_class
  )
  select 'overall', ranking_position, case when ranking_name_public or user_id = auth.uid() then name else coalesce(program_class,'VAULTEX') || '会員' end, best_value, user_id = auth.uid()
  from overall_ranked where ranking_position <= 3
  union all
  select 'class', ranking_position, case when ranking_name_public or user_id = auth.uid() then name else coalesce(program_class,'VAULTEX') || '会員' end, best_value, user_id = auth.uid()
  from class_ranked where ranking_position <= 3 order by 1,2;
$$;

revoke all on function public.get_performance_rankings(text,text,integer) from public;
grant execute on function public.get_performance_rankings(text,text,integer) to authenticated;
revoke all on function public.get_performance_leaderboard(text,text,integer) from public;
grant execute on function public.get_performance_leaderboard(text,text,integer) to authenticated;

drop policy if exists "Admins can manage control test definitions" on public.control_test_definitions;
create policy "Admins can manage control test definitions" on public.control_test_definitions for all to authenticated
using (exists (select 1 from public.user_roles where user_id=auth.uid() and role='admin'))
with check (exists (select 1 from public.user_roles where user_id=auth.uid() and role='admin'));
drop policy if exists "Admins can manage control test settings" on public.control_test_class_settings;
create policy "Admins can manage control test settings" on public.control_test_class_settings for all to authenticated
using (exists (select 1 from public.user_roles where user_id=auth.uid() and role='admin'))
with check (exists (select 1 from public.user_roles where user_id=auth.uid() and role='admin'));
