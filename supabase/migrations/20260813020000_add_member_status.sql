alter table public.players add column if not exists member_status text not null default 'active';
alter table public.players add column if not exists member_status_changed_at timestamptz;

alter table public.players
  drop constraint if exists players_member_status_check,
  add constraint players_member_status_check check (member_status in ('active', 'paused', 'withdrawn'));

create or replace function public.set_member_status(p_member_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_status not in ('active', 'paused', 'withdrawn') then
    raise exception 'Invalid member status';
  end if;

  if not exists (
    select 1
    from public.players target
    where target.user_id = p_member_id
      and (
        exists (select 1 from public.user_roles r where r.user_id = auth.uid() and r.role = 'admin')
        or exists (
          select 1
          from public.user_roles r
          join public.coach_class_assignments a on a.coach_id = r.user_id
          where r.user_id = auth.uid()
            and r.role = 'coach'
            and a.program_class = target.program_class
        )
      )
  ) then
    raise exception 'Not authorized to manage this member';
  end if;

  update public.players
  set member_status = p_status,
      member_status_changed_at = now()
  where user_id = p_member_id;

  if p_status <> 'active' then
    delete from public.push_subscriptions where user_id = p_member_id;
  end if;
end;
$$;

revoke all on function public.set_member_status(uuid, text) from public;
grant execute on function public.set_member_status(uuid, text) to authenticated;

create or replace function public.get_performance_rankings(p_category text, p_record_kind text, p_year integer default null)
returns table(overall_rank integer, overall_total integer, overall_top_percent numeric, class_rank integer, class_total integer, class_top_percent numeric, program_class text, gender text)
language sql security definer set search_path = public stable as $$
  with caller as (
    select p.program_class, p.gender from public.players p where p.user_id = auth.uid() and p.member_status = 'active' limit 1
  ), personal_bests as (
    select r.user_id, p.program_class, p.gender,
      case when p_category in ('30m走', '50m走', '100m', '200m', '400m', '800m', '1500m', '5000m', '100mH', '110mH', '400mH') then min(r.value) else max(r.value) end as best_value
    from public.performance_records r
    join public.players p on p.user_id = r.user_id
    cross join caller c
    where r.category = p_category and r.record_kind = p_record_kind
      and (p_year is null or extract(year from r.date)::integer = p_year)
      and c.gender is not null and p.gender = c.gender and p.member_status = 'active'
    group by r.user_id, p.program_class, p.gender
  ), ranked as (
    select user_id, program_class, gender,
      rank() over (order by
        case when p_category in ('30m走', '50m走', '100m', '200m', '400m', '800m', '1500m', '5000m', '100mH', '110mH', '400mH') then best_value end asc nulls last,
        case when p_category not in ('30m走', '50m走', '100m', '200m', '400m', '800m', '1500m', '5000m', '100mH', '110mH', '400mH') then best_value end desc nulls last)::integer as overall_position,
      count(*) over ()::integer as overall_count,
      case when program_class is not null then rank() over (partition by program_class order by
        case when p_category in ('30m走', '50m走', '100m', '200m', '400m', '800m', '1500m', '5000m', '100mH', '110mH', '400mH') then best_value end asc nulls last,
        case when p_category not in ('30m走', '50m走', '100m', '200m', '400m', '800m', '1500m', '5000m', '100mH', '110mH', '400mH') then best_value end desc nulls last)::integer end as class_position,
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
      case when p_category in ('30m走', '50m走', '100m', '200m', '400m', '800m', '1500m', '5000m', '100mH', '110mH', '400mH') then min(r.value) else max(r.value) end as best_value
    from public.performance_records r
    join public.players p on p.user_id = r.user_id
    cross join caller c
    where r.category = p_category and r.record_kind = p_record_kind
      and (p_year is null or extract(year from r.date)::integer = p_year)
      and c.gender is not null and p.gender = c.gender and p.member_status = 'active'
    group by r.user_id, p.name, p.program_class, p.ranking_name_public
  ), overall_ranked as (
    select *, rank() over (order by
      case when p_category in ('30m走', '50m走', '100m', '200m', '400m', '800m', '1500m', '5000m', '100mH', '110mH', '400mH') then best_value end asc nulls last,
      case when p_category not in ('30m走', '50m走', '100m', '200m', '400m', '800m', '1500m', '5000m', '100mH', '110mH', '400mH') then best_value end desc nulls last)::integer as ranking_position
    from personal_bests
  ), class_ranked as (
    select pb.*, rank() over (order by
      case when p_category in ('30m走', '50m走', '100m', '200m', '400m', '800m', '1500m', '5000m', '100mH', '110mH', '400mH') then best_value end asc nulls last,
      case when p_category not in ('30m走', '50m走', '100m', '200m', '400m', '800m', '1500m', '5000m', '100mH', '110mH', '400mH') then best_value end desc nulls last)::integer as ranking_position
    from personal_bests pb cross join caller c
    where c.program_class is not null and pb.program_class = c.program_class
  )
  select 'overall', ranking_position, case when ranking_name_public or user_id = auth.uid() then name else coalesce(program_class, 'VAULTEX') || '会員' end, best_value, user_id = auth.uid()
  from overall_ranked where ranking_position <= 3
  union all
  select 'class', ranking_position, case when ranking_name_public or user_id = auth.uid() then name else coalesce(program_class, 'VAULTEX') || '会員' end, best_value, user_id = auth.uid()
  from class_ranked where ranking_position <= 3 order by 1, 2;
$$;

create or replace function public.get_push_targets(p_kind text, p_record_id bigint default null, p_audience text default null, p_program_class text default null)
returns table(endpoint text, p256dh text, auth text)
language sql security definer set search_path = public stable as $$
  select distinct s.endpoint, s.p256dh, s.auth
  from public.push_subscriptions s
  join public.players p on p.user_id = s.user_id
  where p.member_status = 'active'
    and exists (select 1 from public.user_roles r where r.user_id = auth.uid() and r.role in ('coach', 'admin'))
    and (
      (p_kind = 'feedback' and exists (select 1 from public.performance_records pr where pr.id = p_record_id and pr.user_id = s.user_id))
      or (p_kind = 'announcement' and (p_audience = 'all' or (p_audience = 'class' and p.program_class = p_program_class)))
    );
$$;
