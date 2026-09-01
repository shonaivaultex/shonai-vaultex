create policy "No client access to family attendance reminder claims"
on public.family_attendance_reminders
for all
to authenticated
using (false)
with check (false);
