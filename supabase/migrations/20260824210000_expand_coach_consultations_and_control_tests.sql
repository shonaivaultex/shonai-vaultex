-- Generalize the existing video-feedback flow into a coach consultation flow.
-- Existing rows keep their video paths; new consultations may be text-only.
alter table public.video_feedback_requests
  alter column video_path drop not null;

comment on table public.video_feedback_requests is
  'Athlete-to-coach consultations. The initial video is optional; messages can contain text, images, or videos.';

-- Advanced jump tests are stored in the same SCAN/measurement structure without
-- changing the six established ATHLETE SCAN abilities. Their diagnostic weights
-- remain inactive until VAULTEX STANDARD thresholds are formally approved.
insert into public.control_test_definitions
  (test_code, version, category, sort_order, ability_name_ja, ability_name_en,
   description, primary_metric_key, primary_unit, better_direction, protocol, active)
values
  (
    'vertical_jump', 3, '垂直跳', 8, '垂直跳躍力', 'VERTICAL JUMP PERFORMANCE',
    '静止状態から上方向へ発揮した跳躍パフォーマンスを確認する。',
    'jump_height', 'cm', 'higher',
    jsonb_build_object(
      'start_method','要設定','attempts','要設定','rest','要設定',
      'measurement_method','ジャンプマット等で跳躍高を測定する。',
      'foul_conditions','要設定','adopted_record','要設定',
      'equipment','ジャンプマット等','notes','ATHLETE TYPEへの反映基準は要設定。'
    ), true
  ),
  (
    'drop_jump', 3, 'ドロップジャンプ', 9, '落下反発パフォーマンス', 'DROP JUMP PERFORMANCE',
    '台からの落下後、短い接地から跳躍へつなげる反発パフォーマンスを確認する。',
    'dj_index', 'DJ-index', 'higher',
    jsonb_build_object(
      'start_method','台高を含め要設定','attempts','要設定','rest','要設定',
      'measurement_method','ジャンプマット等で接地時間と跳躍高を測定する。',
      'foul_conditions','要設定','adopted_record','要設定',
      'equipment','台・ジャンプマット等','notes','台高とATHLETE TYPEへの反映基準は要設定。'
    ), true
  )
on conflict (test_code) do update set
  version=excluded.version, category=excluded.category, sort_order=excluded.sort_order,
  ability_name_ja=excluded.ability_name_ja, ability_name_en=excluded.ability_name_en,
  description=excluded.description, primary_metric_key=excluded.primary_metric_key,
  primary_unit=excluded.primary_unit, better_direction=excluded.better_direction,
  protocol=excluded.protocol, active=excluded.active, updated_at=now();

insert into public.control_test_class_settings (test_code, program_class, gender, enabled)
select test_code, program_class, gender, true
from (values ('vertical_jump'),('drop_jump')) tests(test_code)
cross join (values ('ジュニア'),('ユース'),('エリート'),('マスターズ')) classes(program_class)
cross join (values ('male'),('female')) genders(gender)
on conflict do nothing;
