-- Audit log: records significant actions across the platform.
-- Run this in the Supabase SQL editor (or via supabase db push).

create table if not exists public.audit_logs (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  actor_type  text not null check (actor_type in ('couple', 'guest', 'superadmin', 'system')),
  actor_id    text,                -- user id, guest name, or 'system'
  action      text not null,      -- e.g. 'payment.activated', 'trial.granted', 'photo.uploaded'
  wedding_id  uuid references public.weddings(id) on delete set null,
  detail      jsonb               -- free-form context: amounts, references, plan ids…
);

create index if not exists audit_logs_wedding_idx on public.audit_logs (wedding_id, created_at desc);
create index if not exists audit_logs_action_idx  on public.audit_logs (action, created_at desc);

-- RLS: only service role writes/reads (superadmin uses service client).
alter table public.audit_logs enable row level security;
-- No policies added on purpose: anon/authenticated clients get no access;
-- the service role bypasses RLS.
