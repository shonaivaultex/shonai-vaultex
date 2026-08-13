alter table public.push_subscriptions add column if not exists notify_feedback boolean not null default true;
alter table public.push_subscriptions add column if not exists notify_important boolean not null default true;
alter table public.push_subscriptions add column if not exists notify_schedule boolean not null default true;

create or replace function public.get_push_targets(p_kind text, p_record_id bigint default null, p_audience text default null, p_program_class text default null)
returns table(endpoint text, p256dh text, auth text)
language sql security definer set search_path = public stable as $$
  select distinct s.endpoint, s.p256dh, s.auth
  from public.push_subscriptions s
  join public.players p on p.user_id = s.user_id
  where p.member_status = 'active'
    and exists (select 1 from public.user_roles r where r.user_id = auth.uid() and r.role in ('coach', 'admin'))
    and (
      (p_kind = 'feedback' and s.notify_feedback and exists (select 1 from public.performance_records pr where pr.id = p_record_id and pr.user_id = s.user_id))
      or (p_kind = 'announcement' and s.notify_important and (p_audience = 'all' or (p_audience = 'class' and p.program_class = p_program_class)))
      or (p_kind = 'schedule' and s.notify_schedule and (p_audience = 'all' or (p_audience = 'class' and p.program_class = p_program_class)))
    );
$$;
