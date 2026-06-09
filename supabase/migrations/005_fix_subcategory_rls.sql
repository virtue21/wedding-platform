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
