drop policy if exists "Assigned coaches can read player profiles" on public.players;
create policy "Assigned coaches can read player profiles"
on public.players
for select
to authenticated
using (public.is_assigned_coach(user_id));
