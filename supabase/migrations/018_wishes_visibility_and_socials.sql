-- Wishes visibility + couple Instagram handles.
--
-- All three columns are additive. wishes_public defaults to true so existing
-- wedding pages keep showing the wishes wall exactly as they do today.

alter table public.weddings
  add column if not exists wishes_public    boolean not null default true,
  add column if not exists bride_instagram  text,
  add column if not exists groom_instagram  text;

-- When wishes are private, guests must not be able to read other guests'
-- messages — hiding them in the UI alone is not enough, since the anon key
-- can query the table directly. Reads are now allowed only for weddings that
-- have opted in; the couple's own dashboard reads via the service role.
drop policy if exists "Public can view notes" on public.wedding_notes;

create policy "Public can view notes"
  on public.wedding_notes for select
  using (
    wedding_id in (select id from public.weddings where wishes_public)
  );
