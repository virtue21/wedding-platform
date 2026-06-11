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
