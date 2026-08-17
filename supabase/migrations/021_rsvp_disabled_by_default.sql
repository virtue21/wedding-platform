-- New weddings should start with RSVP off until the couple has an active
-- plan and deliberately turns it on — not on by default from creation.
-- Existing weddings are untouched; this only changes the default for
-- rows inserted from here on.
alter table public.weddings
  alter column rsvp_enabled set default false;
