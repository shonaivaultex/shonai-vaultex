drop policy if exists "Members can read relevant schedules" on public.schedules;

create policy "Members can read relevant schedules"
on public.schedules
for select
to authenticated
using (
  author_id = (select auth.uid())
  or audience = 'all'
  or exists (
    select 1
    from public.players p
    where p.user_id = (select auth.uid())
      and p.program_class = schedules.program_class
  )
);

comment on policy "Members can read relevant schedules" on public.schedules is
  'Members can read all-member schedules and their class schedules; schedule authors can always read schedules they created.';
