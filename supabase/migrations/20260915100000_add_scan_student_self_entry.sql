alter table public.scan_team_sessions
  add column if not exists join_code text,
  add column if not exists selected_test_codes text[] not null default '{}',
  add column if not exists participation_mode text not null default 'coach' check (participation_mode in ('coach','student'));

create unique index if not exists scan_team_sessions_join_code_idx
  on public.scan_team_sessions(join_code) where join_code is not null;

alter table public.scan_team_measurements
  alter column entered_by drop not null,
  add column if not exists entry_source text not null default 'coach' check (entry_source in ('coach','student'));

create table if not exists public.scan_session_participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.scan_team_sessions(id) on delete cascade,
  team_id uuid not null references public.scan_teams(id) on delete cascade,
  athlete_id uuid not null references public.scan_team_athletes(id) on delete cascade,
  pin_hash text not null,
  access_token_hash text not null,
  draft_values jsonb not null default '{}'::jsonb,
  status text not null default 'inputting' check (status in ('inputting','submitted','confirmed')),
  started_at timestamptz not null default now(),
  last_saved_at timestamptz not null default now(),
  submitted_at timestamptz,
  unique(session_id,athlete_id)
);

create index if not exists scan_session_participants_session_status_idx
  on public.scan_session_participants(session_id,status);

alter table public.scan_session_participants enable row level security;
revoke all on public.scan_session_participants from anon,authenticated;

comment on column public.scan_team_sessions.join_code is 'Random high-entropy code embedded in the student QR join URL.';
comment on column public.scan_session_participants.pin_hash is 'SHA-256 hash of the athlete four-digit resume PIN, salted with the session id.';
comment on column public.scan_session_participants.access_token_hash is 'SHA-256 hash of a random per-device bearer token.';
