alter table public.performance_records
  add column if not exists wind_speed numeric(4,1);

comment on column public.performance_records.wind_speed is
  'Wind speed in metres per second. Positive is tailwind; negative is headwind.';

alter table public.performance_records
  drop constraint if exists performance_records_wind_speed_range;
alter table public.performance_records
  add constraint performance_records_wind_speed_range
  check (wind_speed is null or wind_speed between -20.0 and 20.0);

create or replace function public.is_performance_wind_legal(
  p_category text,
  p_wind_speed numeric
)
returns boolean
language sql
immutable
parallel safe
set search_path = public
as $$
  select p_category not in ('100m','200m','100mH','110mH','走幅跳','三段跳')
    or p_wind_speed is null
    or p_wind_speed <= 2.0;
$$;

revoke all on function public.is_performance_wind_legal(text, numeric) from public, anon, authenticated;

-- Patch the current production ranking functions without changing their return
-- signatures. Existing records with no stored wind remain eligible for backwards
-- compatibility; only explicitly wind-assisted records over +2.0m/s are excluded.
do $$
declare
  signature regprocedure;
  original_definition text;
  updated_definition text;
begin
  foreach signature in array array[
    'public.get_performance_rankings(text,text,integer)'::regprocedure,
    'public.get_performance_leaderboard(text,text,integer)'::regprocedure,
    'public.get_official_ranking_page(text,integer,text,text)'::regprocedure,
    'public.get_monthly_growth_rankings(text,text,date,text,text)'::regprocedure
  ] loop
    original_definition := pg_get_functiondef(signature);
    updated_definition := regexp_replace(
      original_definition,
      '(where[[:space:]]+r\.category[[:space:]]*=[[:space:]]*p_category)',
      E'\\1\n    and public.is_performance_wind_legal(r.category, r.wind_speed)',
      'i'
    );

    if updated_definition = original_definition then
      raise exception 'Could not add wind eligibility to ranking function %', signature;
    end if;

    execute updated_definition;
  end loop;
end;
$$;
