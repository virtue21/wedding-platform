-- AI-illustrated story slides: entitlement flag per plan.
-- Run in the Supabase SQL editor.

alter table public.plans
  add column if not exists has_story_images boolean not null default false;

update public.plans set has_story_images = true where name in ('Grand', 'Prestige');
