-- Existing attendance remains intact. NULL means no numeric limit / start-time cutoff.
alter table public.schedules add column practice_capacity integer check (practice_capacity > 0);
alter table public.schedules add column practice_deadline timestamptz;
create schema if not exists private;

-- AFTER trigger also covers direct upserts, weekly plans and legacy clients.
-- The schedule row serializes competing applications; counts never expose rosters.
create or replace function private.enforce_practice_registration()
returns trigger language plpgsql security definer set search_path = '' as $$
declare s public.schedules%rowtype; occupied bigint;
begin
  if new.status <> 'attending' then return new; end if;
  if tg_op = 'UPDATE' then
    if old.status = 'attending' and old.schedule_id = new.schedule_id and old.user_id = new.user_id then return new; end if;
  end if;
  select * into s from public.schedules where id = new.schedule_id for no key update;
  if s.schedule_type not in ('practice', 'measurement') or s.is_personal_slot then return new; end if;
  if auth.uid() is null then raise exception 'ログインして申し込んでください。'; end if;
  if clock_timestamp() >= least(coalesce(s.practice_deadline, s.starts_at), s.starts_at) then
    raise exception '申込締切を過ぎています。';
  end if;
  if s.practice_capacity is not null then
    select count(*) into occupied from public.schedule_attendance where schedule_id = new.schedule_id and status = 'attending';
    if occupied > s.practice_capacity then raise exception '定員に達しました。申込みできません。'; end if;
  end if;
  return new;
end $$;
revoke all on function private.enforce_practice_registration() from public, anon, authenticated;
create trigger enforce_practice_registration after insert or update on public.schedule_attendance
for each row execute function private.enforce_practice_registration();

-- Only an authorized viewer may see aggregate availability, not other users' data.
create or replace function private.practice_availability(p_schedule_id bigint)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare s public.schedules%rowtype; occupied bigint;
begin
  if auth.uid() is null then raise exception 'ログインしてください。'; end if;
  select * into s from public.schedules where id = p_schedule_id;
  if not found or not (s.author_id = auth.uid() or s.audience = 'all' or exists (
    select 1 from public.players p where p.user_id = auth.uid() and p.program_class = s.program_class
  )) then raise exception '予定を確認できません。'; end if;
  select count(*) into occupied from public.schedule_attendance where schedule_id = p_schedule_id and status = 'attending';
  return jsonb_build_object('capacity', s.practice_capacity, 'count', occupied,
    'deadline', least(coalesce(s.practice_deadline, s.starts_at), s.starts_at),
    'closed', now() >= least(coalesce(s.practice_deadline, s.starts_at), s.starts_at));
end $$;
revoke all on function private.practice_availability(bigint) from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.practice_availability(bigint) to authenticated;
create or replace function public.practice_availability(p_schedule_id bigint)
returns jsonb language sql security invoker set search_path = '' as $$
  select private.practice_availability(p_schedule_id);
$$;
revoke all on function public.practice_availability(bigint) from public, anon;
grant execute on function public.practice_availability(bigint) to authenticated;
