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
