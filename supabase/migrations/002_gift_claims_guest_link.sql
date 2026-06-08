-- Add guest linkage fields to gift_claims
alter table gift_claims
  add column guest_id uuid references guests(id) on delete set null,
  add column phone text;

create index gift_claims_guest_id_idx on gift_claims(guest_id);

-- Drop old claim_gift function so we can replace the signature
drop function if exists claim_gift(uuid, text);

-- Updated atomic claim function with optional guest linkage
create or replace function claim_gift(
  item_id      uuid,
  claimer_name text,
  claimer_phone text default null,
  p_guest_id   uuid default null
)
returns gift_claims
language plpgsql
security definer
as $$
declare
  v_item     registry_items;
  v_claim    gift_claims;
  v_guest_id uuid := p_guest_id;
begin
  -- Lock the row and check availability
  select * into v_item
  from registry_items
  where id = item_id
  for update;

  if not found then
    raise exception 'Registry item not found';
  end if;

  if v_item.quantity_claimed >= v_item.quantity_needed then
    raise exception 'This item has already been fully claimed';
  end if;

  -- If no guest_id supplied but phone given, try to auto-link
  if v_guest_id is null and claimer_phone is not null then
    select g.id into v_guest_id
    from guests g
    join weddings w on w.id = g.wedding_id
    join registry_items ri on ri.wedding_id = w.id
    where ri.id = item_id
      and g.phone = claimer_phone
      and g.is_removed = false
    limit 1;
  end if;

  insert into gift_claims (registry_item_id, guest_name, phone, guest_id)
  values (item_id, claimer_name, claimer_phone, v_guest_id)
  returning * into v_claim;

  update registry_items
  set quantity_claimed = quantity_claimed + 1
  where id = item_id;

  return v_claim;
end;
$$;
