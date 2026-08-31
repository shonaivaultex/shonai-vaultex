create or replace function public.accept_family_invitation(p_token text)
returns table(athlete_id uuid, guardian_role text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  invitation public.family_invitations%rowtype;
  current_user_id uuid := auth.uid();
  current_email text;
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  if p_token is null or char_length(p_token) < 32 then raise exception 'Invalid invitation'; end if;

  select lower(u.email) into current_email
  from auth.users u
  where u.id = current_user_id;

  if current_email is null or current_email = '' then raise exception 'Authentication email required'; end if;

  select * into invitation
  from public.family_invitations i
  where i.token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
  for update;

  if invitation.id is null or invitation.accepted_at is not null or invitation.expires_at <= now() then
    raise exception 'Invitation is invalid or expired';
  end if;
  if lower(invitation.email) <> current_email then raise exception 'Invitation email does not match'; end if;

  insert into public.family_guardians (user_id, name, email, phone)
  values (current_user_id, invitation.guardian_name, invitation.email, invitation.phone)
  on conflict (user_id) do update set
    name = excluded.name, email = excluded.email,
    phone = coalesce(excluded.phone, public.family_guardians.phone), updated_at = now();

  insert into public.guardian_athlete_links (guardian_id, athlete_id, relationship, guardian_role, status, invited_by)
  values (current_user_id, invitation.athlete_id, invitation.relationship, invitation.guardian_role, 'active', invitation.invited_by)
  on conflict on constraint guardian_athlete_links_pkey do update set
    relationship = excluded.relationship, guardian_role = excluded.guardian_role,
    status = 'active', invited_by = excluded.invited_by, updated_at = now();

  insert into public.user_roles (user_id, role) values (current_user_id, 'guardian') on conflict do nothing;
  update public.family_invitations set accepted_by = current_user_id, accepted_at = now() where id = invitation.id;
  return query select invitation.athlete_id, invitation.guardian_role;
end;
$$;

revoke all on function public.accept_family_invitation(text) from public, anon;
grant execute on function public.accept_family_invitation(text) to authenticated;

create or replace function public.accept_pending_family_invitation()
returns table(athlete_id uuid, guardian_role text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  invitation public.family_invitations%rowtype;
  current_user_id uuid := auth.uid();
  current_email text;
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;

  select lower(u.email) into current_email
  from auth.users u
  where u.id = current_user_id;

  if current_email is null or current_email = '' then raise exception 'Authentication email required'; end if;

  select * into invitation
  from public.family_invitations i
  where lower(i.email) = current_email
    and i.accepted_at is null
    and i.expires_at > now()
  order by i.created_at desc
  limit 1
  for update;

  if invitation.id is null then return; end if;

  insert into public.family_guardians (user_id, name, email, phone)
  values (current_user_id, invitation.guardian_name, invitation.email, invitation.phone)
  on conflict (user_id) do update set
    name = excluded.name, email = excluded.email,
    phone = coalesce(excluded.phone, public.family_guardians.phone), updated_at = now();

  insert into public.guardian_athlete_links (guardian_id, athlete_id, relationship, guardian_role, status, invited_by)
  values (current_user_id, invitation.athlete_id, invitation.relationship, invitation.guardian_role, 'active', invitation.invited_by)
  on conflict on constraint guardian_athlete_links_pkey do update set
    relationship = excluded.relationship, guardian_role = excluded.guardian_role,
    status = 'active', invited_by = excluded.invited_by, updated_at = now();

  insert into public.user_roles (user_id, role) values (current_user_id, 'guardian') on conflict do nothing;
  update public.family_invitations set accepted_by = current_user_id, accepted_at = now() where id = invitation.id;
  return query select invitation.athlete_id, invitation.guardian_role;
end;
$$;

revoke all on function public.accept_pending_family_invitation() from public, anon;
grant execute on function public.accept_pending_family_invitation() to authenticated;
