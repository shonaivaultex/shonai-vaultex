insert into public.user_roles (user_id, role)
select user_id, 'admin'
from public.players
where name = '宮内勝史'
on conflict do nothing;
