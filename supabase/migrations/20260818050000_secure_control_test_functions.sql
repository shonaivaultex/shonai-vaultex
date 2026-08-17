-- Restrict CONTROL TEST RPC exposure. Trigger functions do not need direct client execution.
revoke all on function public.assign_control_test_scan_number() from public, anon, authenticated;
revoke all on function public.get_performance_rankings(text,text,integer) from public, anon;
revoke all on function public.get_performance_leaderboard(text,text,integer) from public, anon;
grant execute on function public.get_performance_rankings(text,text,integer) to authenticated;
grant execute on function public.get_performance_leaderboard(text,text,integer) to authenticated;
