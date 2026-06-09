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
