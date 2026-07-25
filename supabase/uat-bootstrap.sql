-- ============================================================
-- NemiPlanner — full schema bootstrap for a NEW Supabase project
-- Generated from supabase/migrations/ on 2026-07-25
--
-- Paste this whole file into the SQL Editor and Run.
-- Do NOT run this against production — it is for new projects only.
-- ============================================================


-- ==================== 001_initial_schema.sql ====================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

create type guest_side as enum ('bride', 'groom', 'both');
create type category_side as enum ('bride', 'groom');

-- ============================================================
-- USER PROFILES
-- Extends Supabase auth.users with couple-specific fields
-- ============================================================

create table user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  bride_name text not null,
  groom_name text not null,
  created_at timestamptz not null default now()
);

alter table user_profiles enable row level security;

create policy "Users can view own profile"
  on user_profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on user_profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on user_profiles for insert
  with check (auth.uid() = id);

-- ============================================================
-- WEDDINGS
-- ============================================================

create table weddings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  slug text not null unique,
  wedding_date date not null,
  venue_name text not null,
  venue_address text,
  cover_image_url text,
  bank_name text,
  account_number text,
  account_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index weddings_user_id_idx on weddings(user_id);
create index weddings_slug_idx on weddings(slug);

alter table weddings enable row level security;

create policy "Couples can manage own wedding"
  on weddings for all
  using (auth.uid() = user_id);

-- Public read for guest-facing pages (by slug)
create policy "Public can view wedding by slug"
  on weddings for select
  using (true);

-- ============================================================
-- RELATIONSHIP CATEGORIES
-- ============================================================

create table relationship_categories (
  id uuid primary key default uuid_generate_v4(),
  wedding_id uuid not null references weddings(id) on delete cascade,
  side category_side not null,
  label text not null,
  sort_order integer not null default 0
);

create index rel_categories_wedding_id_idx on relationship_categories(wedding_id);

alter table relationship_categories enable row level security;

create policy "Couples can manage own categories"
  on relationship_categories for all
  using (
    exists (
      select 1 from weddings
      where weddings.id = relationship_categories.wedding_id
        and weddings.user_id = auth.uid()
    )
  );

-- Public read so RSVP form can load categories
create policy "Public can view categories"
  on relationship_categories for select
  using (true);

-- ============================================================
-- SEAT TABLES
-- ============================================================

create table seat_tables (
  id uuid primary key default uuid_generate_v4(),
  wedding_id uuid not null references weddings(id) on delete cascade,
  label text not null,
  capacity integer not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index seat_tables_wedding_id_idx on seat_tables(wedding_id);

alter table seat_tables enable row level security;

create policy "Couples can manage own tables"
  on seat_tables for all
  using (
    exists (
      select 1 from weddings
      where weddings.id = seat_tables.wedding_id
        and weddings.user_id = auth.uid()
    )
  );

-- ============================================================
-- GUESTS
-- ============================================================

create table guests (
  id uuid primary key default uuid_generate_v4(),
  wedding_id uuid not null references weddings(id) on delete cascade,
  full_name text not null,
  phone text not null,
  email text,
  side guest_side not null,
  category_id uuid not null references relationship_categories(id),
  table_id uuid references seat_tables(id) on delete set null,
  rsvp_date timestamptz not null default now(),
  is_removed boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  unique(wedding_id, phone)
);

create index guests_wedding_id_idx on guests(wedding_id);
create index guests_phone_idx on guests(wedding_id, phone);
create index guests_category_id_idx on guests(category_id);
create index guests_table_id_idx on guests(table_id);

alter table guests enable row level security;

create policy "Couples can manage own guests"
  on guests for all
  using (
    exists (
      select 1 from weddings
      where weddings.id = guests.wedding_id
        and weddings.user_id = auth.uid()
    )
  );

-- Allow unauthenticated RSVP inserts (guest submitting form)
create policy "Public can insert guests (RSVP)"
  on guests for insert
  with check (true);

-- ============================================================
-- REGISTRY ITEMS
-- ============================================================

create table registry_items (
  id uuid primary key default uuid_generate_v4(),
  wedding_id uuid not null references weddings(id) on delete cascade,
  name text not null,
  description text,
  image_url text,
  price numeric(12, 2) not null,
  checkout_link text,
  quantity_needed integer not null default 1,
  quantity_claimed integer not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint quantity_claimed_non_negative check (quantity_claimed >= 0),
  constraint quantity_needed_positive check (quantity_needed > 0),
  constraint quantity_claimed_lte_needed check (quantity_claimed <= quantity_needed)
);

create index registry_items_wedding_id_idx on registry_items(wedding_id);

alter table registry_items enable row level security;

create policy "Couples can manage own registry"
  on registry_items for all
  using (
    exists (
      select 1 from weddings
      where weddings.id = registry_items.wedding_id
        and weddings.user_id = auth.uid()
    )
  );

-- Public read for guest registry view
create policy "Public can view registry items"
  on registry_items for select
  using (true);

-- ============================================================
-- GIFT CLAIMS
-- ============================================================

create table gift_claims (
  id uuid primary key default uuid_generate_v4(),
  registry_item_id uuid not null references registry_items(id) on delete cascade,
  guest_name text not null,
  claimed_at timestamptz not null default now(),
  is_received boolean not null default false
);

create index gift_claims_registry_item_id_idx on gift_claims(registry_item_id);

alter table gift_claims enable row level security;

-- Public insert so unauthenticated guests can claim gifts
create policy "Public can claim gifts"
  on gift_claims for insert
  with check (true);

-- Public read so quantity remaining can be shown
create policy "Public can view claims"
  on gift_claims for select
  using (true);

create policy "Couples can manage own gift claims"
  on gift_claims for update
  using (
    exists (
      select 1 from registry_items ri
      join weddings w on w.id = ri.wedding_id
      where ri.id = gift_claims.registry_item_id
        and w.user_id = auth.uid()
    )
  );

-- ============================================================
-- FUNCTION: increment quantity_claimed atomically on gift claim
-- ============================================================

create or replace function claim_gift(item_id uuid, claimer_name text)
returns gift_claims
language plpgsql
security definer
as $$
declare
  v_item registry_items;
  v_claim gift_claims;
begin
  -- Lock the row and check availability
  select * into v_item
  from registry_items
  where id = item_id
  for update;

  if not found then
    raise exception 'Registry item not found';
  end if;

  if v_item.quantity_claimed >= v_item.quantity_needed then
    raise exception 'This item has already been fully claimed';
  end if;

  -- Insert the claim
  insert into gift_claims (registry_item_id, guest_name)
  values (item_id, claimer_name)
  returning * into v_claim;

  -- Increment counter
  update registry_items
  set quantity_claimed = quantity_claimed + 1
  where id = item_id;

  return v_claim;
end;
$$;

-- ============================================================
-- FUNCTION: auto-update weddings.updated_at
-- ============================================================

create or replace function touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger weddings_updated_at
  before update on weddings
  for each row execute function touch_updated_at();

-- ============================================================
-- FUNCTION + TRIGGER: auto-create user_profile on sign-up
-- Bride/groom names are passed as user metadata during sign-up
-- ============================================================

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into user_profiles (id, bride_name, groom_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'bride_name', ''),
    coalesce(new.raw_user_meta_data->>'groom_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- STORAGE BUCKETS (run in Supabase dashboard or via CLI)
-- supabase storage create registry-images --public
-- supabase storage create cover-images --public
-- ============================================================


-- ==================== 002_gift_claims_guest_link.sql ====================

-- Add guest linkage fields to gift_claims
alter table gift_claims
  add column guest_id uuid references guests(id) on delete set null,
  add column phone text;

create index gift_claims_guest_id_idx on gift_claims(guest_id);

-- Drop old claim_gift function so we can replace the signature
drop function if exists claim_gift(uuid, text);

-- Updated atomic claim function with optional guest linkage
create or replace function claim_gift(
  item_id      uuid,
  claimer_name text,
  claimer_phone text default null,
  p_guest_id   uuid default null
)
returns gift_claims
language plpgsql
security definer
as $$
declare
  v_item     registry_items;
  v_claim    gift_claims;
  v_guest_id uuid := p_guest_id;
begin
  -- Lock the row and check availability
  select * into v_item
  from registry_items
  where id = item_id
  for update;

  if not found then
    raise exception 'Registry item not found';
  end if;

  if v_item.quantity_claimed >= v_item.quantity_needed then
    raise exception 'This item has already been fully claimed';
  end if;

  -- If no guest_id supplied but phone given, try to auto-link
  if v_guest_id is null and claimer_phone is not null then
    select g.id into v_guest_id
    from guests g
    join weddings w on w.id = g.wedding_id
    join registry_items ri on ri.wedding_id = w.id
    where ri.id = item_id
      and g.phone = claimer_phone
      and g.is_removed = false
    limit 1;
  end if;

  insert into gift_claims (registry_item_id, guest_name, phone, guest_id)
  values (item_id, claimer_name, claimer_phone, v_guest_id)
  returning * into v_claim;

  update registry_items
  set quantity_claimed = quantity_claimed + 1
  where id = item_id;

  return v_claim;
end;
$$;


-- ==================== 003_subcategories_photos_notes.sql ====================

-- ============================================================
-- SUB-CATEGORIES
-- Each category can have sub-categories (e.g., Work > Acme Corp)
-- ============================================================

create table relationship_subcategories (
  id uuid primary key default uuid_generate_v4(),
  category_id uuid not null references relationship_categories(id) on delete cascade,
  label text not null,
  sort_order integer not null default 0
);

create index subcategories_category_id_idx on relationship_subcategories(category_id);

alter table relationship_subcategories enable row level security;

create policy "Couples can manage subcategories"
  on relationship_subcategories for all
  using (
    exists (
      select 1 from relationship_categories rc
      join weddings w on w.id = rc.wedding_id
      where rc.id = relationship_subcategories.category_id
        and w.user_id = auth.uid()
    )
  );

create policy "Public can view subcategories"
  on relationship_subcategories for select
  using (true);

-- Add subcategory_id to guests
alter table guests
  add column subcategory_id uuid references relationship_subcategories(id) on delete set null;

-- Add subcategory_id to seat_tables (for category-based table creation)
alter table seat_tables
  add column category_id uuid references relationship_categories(id) on delete set null,
  add column subcategory_id uuid references relationship_subcategories(id) on delete set null;

-- ============================================================
-- CURRENCY + BANK DETAILS ON WEDDINGS
-- ============================================================

create type currency_type as enum ('NGN', 'USD', 'GBP', 'USDT', 'USDC');
create type crypto_chain as enum ('ethereum', 'bsc', 'polygon', 'solana', 'tron', 'base');

alter table weddings
  add column currency currency_type not null default 'NGN',
  add column crypto_chain crypto_chain,
  add column crypto_address text;

-- ============================================================
-- CASH GIFT RECEIPTS
-- Guests can upload a receipt screenshot when sending cash
-- ============================================================

create table cash_gift_receipts (
  id uuid primary key default uuid_generate_v4(),
  wedding_id uuid not null references weddings(id) on delete cascade,
  registry_item_id uuid references registry_items(id) on delete set null,
  guest_name text not null,
  phone text,
  amount numeric(12, 2),
  receipt_url text not null,
  currency currency_type not null default 'NGN',
  note text,
  submitted_at timestamptz not null default now(),
  is_confirmed boolean not null default false
);

create index cash_receipts_wedding_id_idx on cash_gift_receipts(wedding_id);

alter table cash_gift_receipts enable row level security;

create policy "Public can submit receipts"
  on cash_gift_receipts for insert
  with check (true);

create policy "Public can view own receipt after submit"
  on cash_gift_receipts for select
  using (true);

create policy "Couples can manage receipts"
  on cash_gift_receipts for update
  using (
    exists (
      select 1 from weddings where weddings.id = cash_gift_receipts.wedding_id
        and weddings.user_id = auth.uid()
    )
  );

-- ============================================================
-- WEDDING PHOTOS (guest photo uploads on the day)
-- ============================================================

create table wedding_photos (
  id uuid primary key default uuid_generate_v4(),
  wedding_id uuid not null references weddings(id) on delete cascade,
  uploader_name text not null,
  photo_url text not null,
  caption text,
  uploaded_at timestamptz not null default now()
);

create index wedding_photos_wedding_id_idx on wedding_photos(wedding_id);

alter table wedding_photos enable row level security;

create policy "Public can upload photos"
  on wedding_photos for insert
  with check (true);

create policy "Public can view photos"
  on wedding_photos for select
  using (true);

create policy "Couples can delete photos"
  on wedding_photos for delete
  using (
    exists (
      select 1 from weddings where weddings.id = wedding_photos.wedding_id
        and weddings.user_id = auth.uid()
    )
  );

-- ============================================================
-- GUEST NOTES TO COUPLE
-- ============================================================

create table guest_notes (
  id uuid primary key default uuid_generate_v4(),
  wedding_id uuid not null references weddings(id) on delete cascade,
  guest_id uuid references guests(id) on delete set null,
  sender_name text not null,
  message text not null,
  sent_at timestamptz not null default now(),
  is_read boolean not null default false
);

create index guest_notes_wedding_id_idx on guest_notes(wedding_id);

alter table guest_notes enable row level security;

create policy "Public can send notes"
  on guest_notes for insert
  with check (true);

create policy "Couples can read notes"
  on guest_notes for select
  using (
    exists (
      select 1 from weddings where weddings.id = guest_notes.wedding_id
        and weddings.user_id = auth.uid()
    )
  );

create policy "Couples can mark notes read"
  on guest_notes for update
  using (
    exists (
      select 1 from weddings where weddings.id = guest_notes.wedding_id
        and weddings.user_id = auth.uid()
    )
  );


-- ==================== 004_venue_state_registry_currency.sql ====================

-- Migration 004: Add venue_state to weddings, currency to registry_items

-- Add state field for Nigerian address selection
ALTER TABLE weddings
  ADD COLUMN IF NOT EXISTS venue_state text;

-- Add currency field to registry items (e.g. NGN, USD, GBP)
ALTER TABLE registry_items
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'NGN';


-- ==================== 005_fix_subcategory_rls.sql ====================

-- Re-apply (idempotent) RLS policies for relationship_subcategories.
-- These may have been missing in production, causing INSERT/UPDATE to be
-- silently blocked even though the table exists and SELECT works.

-- Drop existing policies first so we can recreate them cleanly
drop policy if exists "Couples can manage own subcategories" on relationship_subcategories;
drop policy if exists "Public can view subcategories"        on relationship_subcategories;

-- Make sure RLS is on
alter table relationship_subcategories enable row level security;

-- Owners: full access (SELECT/INSERT/UPDATE/DELETE)
-- Uses WITH CHECK explicitly for INSERT so auth.uid() is evaluated against the new row.
create policy "Couples can manage own subcategories"
  on relationship_subcategories
  for all
  using (
    exists (
      select 1
      from relationship_categories rc
      join weddings w on w.id = rc.wedding_id
      where rc.id = relationship_subcategories.category_id
        and w.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from relationship_categories rc
      join weddings w on w.id = rc.wedding_id
      where rc.id = relationship_subcategories.category_id
        and w.user_id = auth.uid()
    )
  );

-- Public: read-only (for RSVP form)
create policy "Public can view subcategories"
  on relationship_subcategories
  for select
  using (true);


-- ==================== 006_payment_methods_storage.sql ====================

-- ── wedding_payment_methods ───────────────────────────────────────────────────
-- Replaces the single-currency bank/crypto fields on the weddings table.
-- Couples can add one entry per currency (NGN, USD, GBP, USDT, USDC).

create table if not exists wedding_payment_methods (
  id            uuid primary key default gen_random_uuid(),
  wedding_id    uuid references weddings(id) on delete cascade not null,
  currency      text not null check (currency in ('NGN','USD','GBP','USDT','USDC')),
  bank_name     text,
  bank_code     text,
  account_number text,
  account_name  text,
  crypto_chain  text,
  crypto_address text,
  sort_order    int  default 0,
  created_at    timestamptz default now(),
  unique (wedding_id, currency)
);

alter table wedding_payment_methods enable row level security;

drop policy if exists "Couples can manage own payment methods" on wedding_payment_methods;
create policy "Couples can manage own payment methods"
  on wedding_payment_methods for all
  using  (wedding_id in (select id from weddings where user_id = auth.uid()))
  with check (wedding_id in (select id from weddings where user_id = auth.uid()));

drop policy if exists "Public can view payment methods" on wedding_payment_methods;
create policy "Public can view payment methods"
  on wedding_payment_methods for select using (true);

-- ── Storage buckets ────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values
  ('cover-images',  'cover-images',  true),
  ('cash-receipts', 'cash-receipts', true)
on conflict (id) do nothing;

-- cover-images: authenticated upload, public read
drop policy if exists "cover images public read"    on storage.objects;
drop policy if exists "cover images auth upload"    on storage.objects;
drop policy if exists "cover images auth update"    on storage.objects;

create policy "cover images public read"
  on storage.objects for select using (bucket_id = 'cover-images');

create policy "cover images auth upload"
  on storage.objects for insert
  with check (bucket_id = 'cover-images' and auth.uid() is not null);

create policy "cover images auth update"
  on storage.objects for update
  using (bucket_id = 'cover-images' and auth.uid() is not null);

-- cash-receipts: anyone can upload (guests are unauthenticated), couple views via signed in session
drop policy if exists "cash receipts public read"   on storage.objects;
drop policy if exists "cash receipts public upload" on storage.objects;

create policy "cash receipts public read"
  on storage.objects for select using (bucket_id = 'cash-receipts');

create policy "cash receipts public upload"
  on storage.objects for insert with check (bucket_id = 'cash-receipts');


-- ==================== 007_notes_photos_rsvp_settings.sql ====================

-- RSVP settings on weddings table
alter table weddings
  add column if not exists rsvp_enabled boolean default true,
  add column if not exists rsvp_limit int default null;

-- Guest-facing notes/wishes board (public read + write)
create table if not exists wedding_notes (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid references weddings(id) on delete cascade not null,
  author_name text not null,
  message text not null,
  created_at timestamptz default now()
);
alter table wedding_notes enable row level security;
drop policy if exists "Public can view notes" on wedding_notes;
drop policy if exists "Public can post notes" on wedding_notes;
drop policy if exists "Couples can delete notes" on wedding_notes;
create policy "Public can view notes" on wedding_notes for select using (true);
create policy "Public can post notes" on wedding_notes for insert with check (true);
create policy "Couples can delete notes" on wedding_notes for delete
  using (wedding_id in (select id from weddings where user_id = auth.uid()));

-- Guest-uploaded moment photos
create table if not exists wedding_photos (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid references weddings(id) on delete cascade not null,
  uploader_name text,
  photo_url text not null,
  caption text,
  created_at timestamptz default now()
);
alter table wedding_photos enable row level security;
drop policy if exists "Public can view photos" on wedding_photos;
drop policy if exists "Public can upload photos" on wedding_photos;
drop policy if exists "Couples can delete photos" on wedding_photos;
create policy "Public can view photos" on wedding_photos for select using (true);
create policy "Public can upload photos" on wedding_photos for insert with check (true);
create policy "Couples can delete photos" on wedding_photos for delete
  using (wedding_id in (select id from weddings where user_id = auth.uid()));

-- Storage bucket for guest-uploaded photos
insert into storage.buckets (id, name, public) values ('wedding-moments', 'wedding-moments', true)
on conflict (id) do nothing;
drop policy if exists "wedding moments public read" on storage.objects;
drop policy if exists "wedding moments public upload" on storage.objects;
create policy "wedding moments public read" on storage.objects for select using (bucket_id = 'wedding-moments');
create policy "wedding moments public upload" on storage.objects for insert with check (bucket_id = 'wedding-moments');


-- ==================== 008_story_slides.sql ====================

-- Love story slides
create table if not exists wedding_story_slides (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid references weddings(id) on delete cascade not null,
  slide_number int not null default 0,
  title text,
  body text not null,
  image_url text,
  created_at timestamptz default now()
);
alter table wedding_story_slides enable row level security;
drop policy if exists "Public read story slides" on wedding_story_slides;
drop policy if exists "Owner manage story slides" on wedding_story_slides;
create policy "Public read story slides" on wedding_story_slides for select using (true);
create policy "Owner manage story slides" on wedding_story_slides for all
  using (wedding_id in (select id from weddings where user_id = auth.uid()))
  with check (wedding_id in (select id from weddings where user_id = auth.uid()));

-- Storage bucket for slide images
insert into storage.buckets (id, name, public) values ('story-images', 'story-images', true)
on conflict (id) do nothing;
drop policy if exists "story images public read" on storage.objects;
drop policy if exists "story images owner upload" on storage.objects;
create policy "story images public read" on storage.objects for select using (bucket_id = 'story-images');
create policy "story images owner upload" on storage.objects for insert with check (bucket_id = 'story-images');


-- ==================== 009_plans_subscriptions.sql ====================

-- Plans table (no hardcoded values — everything editable from superadmin)
create table if not exists plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price integer not null, -- in kobo (₦15,000 = 1500000)
  guest_cap integer default null, -- null = unlimited
  registry_item_cap integer default null,
  table_cap integer default null,
  has_moments boolean default false,
  moments_upload_cap integer default null,
  has_cover_image boolean default true,
  has_digital_iv boolean default true,
  has_gate_scanner boolean default true,
  is_active boolean default false, -- disabled until superadmin enables
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Seed plans (all disabled by default)
insert into plans (name, price, guest_cap, registry_item_cap, table_cap, has_moments, moments_upload_cap, has_cover_image, has_digital_iv, has_gate_scanner, is_active, sort_order) values
('Ember',    1500000,  50,   15,   5,    false, null, true, true, true, false, 1),
('Classic',  2500000,  150,  30,   15,   true,  50,   true, true, true, false, 2),
('Grand',    4000000,  300,  null, null, true,  150,  true, true, true, false, 3),
('Prestige', 6000000,  null, null, null, true,  null, true, true, true, false, 4);

-- Wedding subscriptions
create table if not exists wedding_subscriptions (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid references weddings(id) on delete cascade not null unique,
  plan_id uuid references plans(id) not null,
  paystack_reference text unique,
  status text not null default 'pending' check (status in ('pending', 'active', 'expired')),
  activated_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS
alter table plans enable row level security;
alter table wedding_subscriptions enable row level security;

create policy "Plans public read" on plans for select using (true);
create policy "Subscriptions owner read" on wedding_subscriptions for select
  using (wedding_id in (select id from weddings where user_id = auth.uid()));
create policy "Subscriptions owner write" on wedding_subscriptions for all
  using (wedding_id in (select id from weddings where user_id = auth.uid()))
  with check (wedding_id in (select id from weddings where user_id = auth.uid()));


-- ==================== 010_subscription_statuses.sql ====================

-- Extend the status check on wedding_subscriptions to allow paused + cancelled
alter table wedding_subscriptions
  drop constraint if exists wedding_subscriptions_status_check;

alter table wedding_subscriptions
  add constraint wedding_subscriptions_status_check
  check (status in ('pending', 'active', 'expired', 'paused', 'cancelled'));

-- Add amount_paid column to track how much was charged
alter table wedding_subscriptions
  add column if not exists amount_paid integer null; -- in kobo


-- ==================== 011_audit_logs.sql ====================

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


-- ==================== 012_drive_folder.sql ====================

-- Google Drive folder per wedding (guest photo archive).
-- Run in the Supabase SQL editor.

alter table public.weddings
  add column if not exists drive_folder_id  text,
  add column if not exists drive_folder_url text;


-- ==================== 013_story_images_flag.sql ====================

-- AI-illustrated story slides: entitlement flag per plan.
-- Run in the Supabase SQL editor.

alter table public.plans
  add column if not exists has_story_images boolean not null default false;

update public.plans set has_story_images = true where name in ('Grand', 'Prestige');


-- ==================== 014_registry_images_bucket.sql ====================

-- registry-images was created by hand in the dashboard rather than by a
-- migration (001 only mentions it in a comment), so a fresh project built
-- from migrations alone would be missing it. This makes it reproducible.
-- Safe to re-run on production: the bucket insert is a no-op if it exists.

insert into storage.buckets (id, name, public)
values ('registry-images', 'registry-images', true)
on conflict (id) do nothing;

drop policy if exists "registry images public read"  on storage.objects;
drop policy if exists "registry images auth upload"  on storage.objects;
drop policy if exists "registry images auth update"  on storage.objects;
drop policy if exists "registry images auth delete"  on storage.objects;

create policy "registry images public read"
  on storage.objects for select using (bucket_id = 'registry-images');

create policy "registry images auth upload"
  on storage.objects for insert
  with check (bucket_id = 'registry-images' and auth.uid() is not null);

create policy "registry images auth update"
  on storage.objects for update
  using (bucket_id = 'registry-images' and auth.uid() is not null);

create policy "registry images auth delete"
  on storage.objects for delete
  using (bucket_id = 'registry-images' and auth.uid() is not null);

