-- Venue name is no longer required — couples often book a venue after they
-- start planning, and shouldn't be blocked from setting up their page.

alter table public.weddings
  alter column venue_name drop not null;
