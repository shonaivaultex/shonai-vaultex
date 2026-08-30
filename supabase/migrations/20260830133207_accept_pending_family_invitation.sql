create or replace function public.accept_pending_family_invitation()
returns table(athlete_id uuid, guardian_role text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  invitation public.family_invitations%rowtype;
  current_user_id uuid := auth.uid();
  current_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
begin
  if current_user_id is null or current_email = '' then
    raise exception 'Authentication required';
  end if;

  select * into invitation
  from public.family_invitations i
  where lower(i.email) = current_email
    and i.accepted_at is null
    and i.expires_at > now()
  order by i.created_at desc
  limit 1
  for update;

  if invitation.id is null then
    return;
  end if;

  insert into public.family_guardians (user_id, name, email, phone)
  values (current_user_id, invitation.guardian_name, invitation.email, invitation.phone)
  on conflict (user_id) do update set
    name = excluded.name,
    email = excluded.email,
    phone = coalesce(excluded.phone, public.family_guardians.phone),
    updated_at = now();

  insert into public.guardian_athlete_links (guardian_id, athlete_id, relationship, guardian_role, status, invited_by)
  values (current_user_id, invitation.athlete_id, invitation.relationship, invitation.guardian_role, 'active', invitation.invited_by)
  on conflict (guardian_id, athlete_id) do update set
    relationship = excluded.relationship,
    guardian_role = excluded.guardian_role,
    status = 'active',
    invited_by = excluded.invited_by,
    updated_at = now();

  insert into public.user_roles (user_id, role)
  values (current_user_id, 'guardian')
  on conflict do nothing;

  update public.family_invitations
  set accepted_by = current_user_id, accepted_at = now()
  where id = invitation.id;

  return query select invitation.athlete_id, invitation.guardian_role;
end;
$$;

revoke all on function public.accept_pending_family_invitation() from public, anon;
grant execute on function public.accept_pending_family_invitation() to authenticated;

comment on function public.accept_pending_family_invitation() is
  'Accepts the latest unexpired FAMILY invitation matching the authenticated, verified email address.';
