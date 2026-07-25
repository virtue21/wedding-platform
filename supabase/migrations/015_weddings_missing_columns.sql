-- Schema drift repair.
--
-- bank_code, venue_lat and venue_lng exist in production (added by hand in
-- the dashboard) and are referenced by the app and the generated types, but
-- no migration ever created them. A project rebuilt from migrations alone
-- fails on wedding setup with:
--   "Could not find the 'bank_code' column of 'weddings' in the schema cache"
--
-- Idempotent — safe to run against production, where it will be a no-op.

alter table public.weddings
  add column if not exists bank_code text,
  add column if not exists venue_lat double precision,
  add column if not exists venue_lng double precision;
