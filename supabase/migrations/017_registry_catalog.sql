-- AI Registry Assistant — curated catalog + couple personalization inputs.
-- Both tables are new; nothing here alters existing production data.

-- ── Curated catalog ───────────────────────────────────────────────────────────
create table if not exists public.registry_catalog (
  id             uuid primary key default gen_random_uuid(),
  category       text not null,
  tier           text not null check (tier in ('budget', 'premium')),
  item_name      text,                      -- null while a slot is unsourced
  price_low      integer,                   -- naira; equals price_high for exact prices
  price_high     integer,
  retailer_url   text,                      -- null → UI falls back to a search link
  notes          text,
  -- true = do not suggest this row; it exists to record the gap
  needs_sourcing boolean not null default false,
  last_verified_date date,
  sort_order     integer not null default 0,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (category, tier)
);

create index if not exists registry_catalog_lookup_idx
  on public.registry_catalog (category, tier) where is_active and not needs_sourcing;

-- Catalog is public reference data: readable by any signed-in couple,
-- writable only by the service role (superadmin tooling).
alter table public.registry_catalog enable row level security;
drop policy if exists "catalog readable" on public.registry_catalog;
create policy "catalog readable" on public.registry_catalog for select using (true);

-- ── Couple personalization inputs ─────────────────────────────────────────────
create table if not exists public.wedding_registry_preferences (
  wedding_id        uuid primary key references public.weddings(id) on delete cascade,
  cooking_frequency text check (cooking_frequency in ('rarely', 'sometimes', 'often')),
  household_size    text check (household_size in ('1-2', '3-4', '5+')),
  budget_band       text check (budget_band in ('lean', 'standard', 'generous')),
  owned_categories  text[] not null default '{}',
  delivery_state    text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

alter table public.wedding_registry_preferences enable row level security;
drop policy if exists "prefs owner all" on public.wedding_registry_preferences;
create policy "prefs owner all" on public.wedding_registry_preferences for all
  using (wedding_id in (select id from public.weddings where user_id = auth.uid()))
  with check (wedding_id in (select id from public.weddings where user_id = auth.uid()));

-- ── Seed from nemiplanner-registry-catalog-v1.md ──────────────────────────────
-- Prices are naira ranges as recorded in the source document. Rows marked
-- needs_sourcing are deliberate placeholders, not invented data.
insert into public.registry_catalog
  (category, tier, item_name, price_low, price_high, notes, needs_sourcing, last_verified_date, sort_order)
values
  ('Cookware', 'budget', 'Dessini Non-Stick Granite Cookware Set (10-piece)', 28000, 35000,
   'Most trusted cookware brand in Nigerian reviews; granite coating, even heat', false, current_date, 1),
  ('Cookware', 'premium', 'Dessini Granite Cookware Set (22-piece)', 110000, 140000,
   'Full kitchen set, includes accessories', false, current_date, 1),

  ('Dinnerware & Cutlery', 'budget', '16-piece Dinner Set + 12-piece Cutlery Set (bundle)', 25000, 40000,
   'Good starter bundle', false, current_date, 2),
  ('Dinnerware & Cutlery', 'premium', null, null, null,
   'Look for porcelain/stoneware branded sets (e.g. Corelle, Tramontina)', true, null, 2),

  ('Blender / Food Processor', 'budget', 'Binatone BLG-450/452 Blender/Grinder', 15000, 35000,
   'Nigeria''s most established brand; easy spare parts, strong after-sales', false, current_date, 3),
  ('Blender / Food Processor', 'premium', 'Kenwood Blend-X / BLP series', 40000, 130000,
   'Best-reviewed for heavy daily use — pepper, beans, tiger nut', false, current_date, 3),

  ('Air Fryer', 'budget', 'Hisense Air Fryer 5.2L 1500W (H06AFGY1S1)', 45000, 60000,
   'Touch display, 7 preset menus. Price needs verifying.', false, current_date, 4),
  ('Air Fryer', 'premium', 'Hisense Touch Screen Display Air Fryer 6.7L', 70000, 90000,
   'Dual basket, larger household size. Price needs verifying.', false, current_date, 4),

  ('Water Dispenser', 'budget', 'Haier Thermocool HD-1233BD', 68000, 68000,
   'Most trusted brand for durability in Nigeria', false, current_date, 5),
  ('Water Dispenser', 'premium', 'Polystar PV-R2JXR-18G', null, null,
   'Danfu 4.0 compressor, built-in fridge cabinet (0–10°C). Current price not confirmed.', false, current_date, 5),

  ('Vacuum Cleaner', 'budget', null, null, null,
   'Binatone or LG upright — no single standout confirmed yet', true, null, 6),
  ('Vacuum Cleaner', 'premium', null, null, null,
   'Consider Bosch or a robot vacuum (Roborock/Eufy) for a "wow" registry item', true, null, 6),

  ('TV', 'budget', 'Hisense TV QLED 50" Q5S FHD Smart 60Hz VIDAA U9', 222800, 399000,
   'Confirmed exact spec match across sources; price varies by retailer', false, current_date, 7),
  ('TV', 'premium', null, null, null,
   'Consider larger size or QLED 4K tier from Hisense/Samsung', true, null, 7),

  ('Washing Machine', 'budget', null, null, null,
   'Needs sourcing — smaller capacity, e.g. 6–8kg', true, null, 8),
  ('Washing Machine', 'premium', 'Hisense 10.5kg Inverter Front Load Washer (HISWM1043BT-WF3S)', 492000, 492000,
   'Steam cleaning, hygiene cycles, allergy care. Store price; verify online.', false, current_date, 8),

  ('Gas Cooker', 'budget', null, 80000, 150000,
   'Needs a specific model — table-top 2–4 burner, e.g. Maxi/Polystar. Price range confirmed.', true, null, 9),
  ('Gas Cooker', 'premium', null, 220000, 600000,
   'Needs a specific model — freestanding with oven, Hisense/Scanfrost/Beko. Price range confirmed.', true, null, 9)
on conflict (category, tier) do nothing;
