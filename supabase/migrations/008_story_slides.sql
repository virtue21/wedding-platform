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
