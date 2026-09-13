alter table public.personal_session_bookings
  add column if not exists requested_location text
  check (requested_location is null or char_length(requested_location) <= 200);
