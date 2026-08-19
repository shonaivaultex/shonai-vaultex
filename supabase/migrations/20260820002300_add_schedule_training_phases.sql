alter table public.schedules
  add column if not exists training_phase text not null default 'normal'
  check (training_phase in ('normal', 'build', 'recovery', 'taper', 'competition'));

alter table public.schedule_templates
  add column if not exists training_phase text not null default 'normal'
  check (training_phase in ('normal', 'build', 'recovery', 'taper', 'competition'));

comment on column public.schedules.training_phase is
  'Training period theme used for schedule color coding.';

comment on column public.schedule_templates.training_phase is
  'Training period theme copied to schedules created from this template.';
