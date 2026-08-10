-- Guest home redesign: ceremony time, dress code, RSVP deadline.
-- All optional — a wedding with none of them simply renders fewer rows.

alter table public.weddings
  add column if not exists ceremony_time  text,   -- "2:00 pm"
  add column if not exists doors_time     text,   -- "1:30 pm"
  add column if not exists dress_code     text,   -- "Garden formal · blush and cream"
  add column if not exists rsvp_deadline  date;
