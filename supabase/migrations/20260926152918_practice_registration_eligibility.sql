-- No existing attendance is removed. Cancellation remains available.
create or replace function private.check_practice_registration_eligibility()
returns trigger language plpgsql security definer set search_path = '' as $$
declare s public.schedules%rowtype;
begin
  if new.status <> 'attending' then return new; end if;
  if tg_op = 'UPDATE' then
    if old.status = 'attending' and old.schedule_id = new.schedule_id and old.user_id = new.user_id then return new; end if;
  end if;
  select * into s from public.schedules where id = new.schedule_id;
  if s.schedule_type not in ('practice', 'measurement') or s.is_personal_slot then return new; end if;
  if auth.uid() is null then raise exception 'ログインして申し込んでください。'; end if;
  if exists (select 1 from public.user_roles r where r.user_id = new.user_id and r.role = 'coach') then
    raise exception 'コーチは参加申込み不要です。参加者一覧をご確認ください。';
  end if;
  if s.audience <> 'all' and not exists (
    select 1 from public.players p where p.user_id = new.user_id and p.program_class = s.program_class
  ) then raise exception '対象クラスの選手のみ申込みできます。'; end if;
  return new;
end $$;
revoke all on function private.check_practice_registration_eligibility() from public, anon, authenticated;
-- AFTER avoids rejecting ON CONFLICT's speculative insert for existing attendance.
create trigger check_practice_registration_eligibility after insert or update on public.schedule_attendance
for each row execute function private.check_practice_registration_eligibility();
