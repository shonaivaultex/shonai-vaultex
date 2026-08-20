drop policy if exists "Members manage own calendar goal" on public.personal_calendar_goals;
drop policy if exists "Assigned coaches read athlete calendar goals" on public.personal_calendar_goals;

create policy "Members and assigned coaches read calendar goals"
on public.personal_calendar_goals for select to authenticated
using ((select auth.uid()) = user_id or public.is_assigned_coach(user_id));

create policy "Members insert own calendar goal"
on public.personal_calendar_goals for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "Members update own calendar goal"
on public.personal_calendar_goals for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Members delete own calendar goal"
on public.personal_calendar_goals for delete to authenticated
using ((select auth.uid()) = user_id);
