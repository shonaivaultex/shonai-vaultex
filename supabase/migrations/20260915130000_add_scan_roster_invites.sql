create table if not exists public.scan_roster_invites (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.scan_teams(id) on delete cascade,
  invite_code text not null unique,
  active boolean not null default true,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);
create index if not exists scan_roster_invites_team_idx on public.scan_roster_invites(team_id, active, created_at desc);
alter table public.scan_roster_invites enable row level security;
revoke all on public.scan_roster_invites from anon, authenticated;
