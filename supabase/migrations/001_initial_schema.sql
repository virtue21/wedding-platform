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
