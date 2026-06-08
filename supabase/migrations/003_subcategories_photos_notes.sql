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
