drop policy if exists "Members can read relevant schedule periods" on public.schedule_periods;
drop policy if exists "Coaches can create schedule periods" on public.schedule_periods;
drop policy if exists "Authors can update schedule periods" on public.schedule_periods;
drop policy if exists "Authors can delete schedule periods" on public.schedule_periods;

create policy "Members can read own schedule periods"
on public.schedule_periods for select to authenticated
using ((select auth.uid()) = author_id);

create policy "Members can create own schedule periods"
on public.schedule_periods for insert to authenticated
with check ((select auth.uid()) = author_id);

create policy "Members can update own schedule periods"
on public.schedule_periods for update to authenticated
using ((select auth.uid()) = author_id)
with check ((select auth.uid()) = author_id);

create policy "Members can delete own schedule periods"
on public.schedule_periods for delete to authenticated
using ((select auth.uid()) = author_id);

comment on table public.schedule_periods is
  'Personal date-only training periods used to color only the author schedule calendar. Legacy audience columns are retained for compatibility.';
