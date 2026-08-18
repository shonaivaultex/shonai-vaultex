alter table public.players
  add column if not exists mypage_tutorial_version smallint not null default 0;

comment on column public.players.mypage_tutorial_version is
  'Latest MY PAGE tutorial version acknowledged by the member.';

-- Do not interrupt members who were already using MY PAGE before this release.
-- Newly created player rows retain the default value 0 and see the tutorial once.
update public.players
set mypage_tutorial_version = 1
where mypage_tutorial_version = 0;
