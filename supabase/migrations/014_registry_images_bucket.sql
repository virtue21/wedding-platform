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
