-- Adds final class-specific conditions without rewriting or deleting legacy measurements.

alter table public.control_test_measurements
  add column if not exists protocol_version integer,
  add column if not exists attempt_count smallint,
  add column if not exists distance_m numeric,
  add column if not exists jump_count smallint,
  add column if not exists implement_name text;

alter table public.control_test_measurements
  drop constraint if exists control_test_measurements_protocol_version_check,
  add constraint control_test_measurements_protocol_version_check check (protocol_version is null or protocol_version > 0),
  drop constraint if exists control_test_measurements_attempt_count_check,
  add constraint control_test_measurements_attempt_count_check check (attempt_count is null or attempt_count > 0),
  drop constraint if exists control_test_measurements_distance_m_check,
  add constraint control_test_measurements_distance_m_check check (distance_m is null or distance_m > 0),
  drop constraint if exists control_test_measurements_jump_count_check,
  add constraint control_test_measurements_jump_count_check check (jump_count is null or jump_count between 1 and 10);

update public.control_test_measurements set
  protocol_version = coalesce(protocol_version, nullif(metrics->>'protocol_version','')::integer),
  attempt_count = coalesce(attempt_count, nullif(metrics->>'attempt_limit','')::smallint),
  distance_m = coalesce(distance_m, nullif(metrics->>'distance_m','')::numeric),
  jump_count = coalesce(jump_count, nullif(metrics->>'jump_count','')::smallint, nullif(metrics->>'trial_count','')::smallint)
where protocol_version is null or attempt_count is null or distance_m is null or jump_count is null;

update public.control_test_definitions set version=3, protocol=jsonb_set(jsonb_set(protocol,'{measurement_method}',to_jsonb('S-CADE等のジャンプマットを使用し、実施した3〜5回すべての跳躍高・接地時間・RJ-indexを保存する。RJ-index＝跳躍高（m）÷接地時間（秒）。'::text)),'{foul_conditions}',to_jsonb('バランスを崩した、マットから外れた、途中で停止した、または本人が明確な失敗を申告した場合は再試技を認める。原則1回まで。'::text)), updated_at=now()
where test_code='rebound_jump';

update public.control_test_definitions set version=3, updated_at=now()
where test_code in ('acceleration_30m','standing_long_jump','standing_five_bound','shot_front_throw','shot_back_throw','speed_endurance_300m');

update public.control_test_class_settings set
  alternate_test_name='立三段跳',
  protocol_overrides=protocol_overrides || '{"jump_count":3,"attempt_limit":2}'::jsonb,
  updated_at=now()
where test_code='standing_five_bound' and program_class='ジュニア';

update public.control_test_class_settings set
  alternate_test_name=case when test_code='shot_front_throw' then '2kgメディシンボール フロント投げ' else '2kgメディシンボール バック投げ' end,
  implement_weight_kg=2,
  protocol_overrides=protocol_overrides || '{"implement_name":"2kgメディシンボール","attempt_limit":2}'::jsonb,
  updated_at=now()
where test_code in ('shot_front_throw','shot_back_throw') and program_class='ジュニア';

update public.control_test_class_settings set
  protocol_overrides=protocol_overrides || '{"minimum_jump_count":3,"maximum_jump_count":5,"default_jump_count":5,"retry_limit":1}'::jsonb,
  updated_at=now()
where test_code='rebound_jump' and program_class='ジュニア';

update public.control_test_class_settings set
  protocol_overrides=protocol_overrides || '{"jump_count":5,"default_jump_count":5,"retry_limit":1}'::jsonb,
  updated_at=now()
where test_code='rebound_jump' and program_class in ('ユース','エリート','マスターズ');

create index if not exists control_test_measurements_conditions_idx
  on public.control_test_measurements(test_code, distance_m, jump_count, implement_weight_kg);

comment on column public.control_test_measurements.protocol_version is 'Protocol version used for this measurement.';
comment on column public.control_test_measurements.attempt_count is 'Official attempt count or limit recorded with the measurement.';
comment on column public.control_test_measurements.distance_m is 'Measured running distance, used to separate 150m and 300m.';
comment on column public.control_test_measurements.jump_count is 'Number of consecutive jumps, used to separate standing bounds and RJ conditions.';
comment on column public.control_test_measurements.implement_name is 'Equipment or implement name, such as 2kg medicine ball or shot.';
