-- Product imagery for catalog items.
--
-- Left null on seed: real product photos have to be sourced deliberately
-- (hosted by us, not hotlinked from a retailer whose listings get relisted).
-- Until a row has one, the UI renders a category tile rather than a blank card.

alter table public.registry_catalog
  add column if not exists image_url text;
