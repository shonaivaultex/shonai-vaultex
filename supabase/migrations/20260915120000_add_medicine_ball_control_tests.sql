insert into public.control_test_definitions
  (test_code, category, sort_order, ability_name_ja, ability_name_en, description, primary_metric_key, primary_unit, better_direction, protocol)
values
  ('medicine_ball_3kg_front', '3kgメディシン投げ（フロント）', 6, '全身爆発力', 'TOTAL BODY POWER', '3kgメディシンボールを前方へ投げ、全身の爆発力を測定する。', 'distance', 'm', 'higher', '{"equipment":"3kgメディシンボール・巻尺","attempts":"最大2本","adopted_record":"遠い方を採用"}'::jsonb),
  ('medicine_ball_3kg_back', '3kgメディシン投げ（バック）', 7, '全身爆発力', 'TOTAL BODY POWER', '3kgメディシンボールを後方へ投げ、全身の爆発力を測定する。', 'distance', 'm', 'higher', '{"equipment":"3kgメディシンボール・巻尺","attempts":"最大2本","adopted_record":"遠い方を採用"}'::jsonb),
  ('medicine_ball_3kg_one_arm', '3kgメディシン投げ（片手）', 8, '片腕爆発力', 'ONE-ARM POWER', '3kgメディシンボールを片手で投げ、片側の上肢と体幹の爆発力を測定する。', 'distance', 'm', 'higher', '{"equipment":"3kgメディシンボール・巻尺","attempts":"最大2本","adopted_record":"遠い方を採用"}'::jsonb)
on conflict (test_code) do update set
  category = excluded.category,
  sort_order = excluded.sort_order,
  ability_name_ja = excluded.ability_name_ja,
  ability_name_en = excluded.ability_name_en,
  description = excluded.description,
  primary_metric_key = excluded.primary_metric_key,
  primary_unit = excluded.primary_unit,
  better_direction = excluded.better_direction,
  protocol = excluded.protocol,
  active = true,
  updated_at = now();
