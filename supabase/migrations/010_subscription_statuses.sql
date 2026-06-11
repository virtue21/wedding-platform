-- Extend the status check on wedding_subscriptions to allow paused + cancelled
alter table wedding_subscriptions
  drop constraint if exists wedding_subscriptions_status_check;

alter table wedding_subscriptions
  add constraint wedding_subscriptions_status_check
  check (status in ('pending', 'active', 'expired', 'paused', 'cancelled'));

-- Add amount_paid column to track how much was charged
alter table wedding_subscriptions
  add column if not exists amount_paid integer null; -- in kobo
