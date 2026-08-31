revoke all on function public.accept_pending_family_invitation() from public, anon, authenticated;

comment on function public.accept_pending_family_invitation() is
  'Legacy automatic acceptance is disabled. FAMILY links must be confirmed with an explicit invitation token through accept_family_invitation(text).';
