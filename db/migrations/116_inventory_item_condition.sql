-- 116: Track item condition (new vs. used) on inventory_items.
--
-- Problem: whether a batch of stock is brand-new (still boxed) or used is
-- currently only ever noted in the free-text description/notes fields, so
-- it's inconsistent and, critically, invisible when staff fulfill a supply
-- request — there's no way to tell which condition of stock is being handed
-- out. Since a room can already hold more than one inventory_items row for
-- the same product (that's how multi-room stock works today), the fix is to
-- let condition vary per row too: the same item name can have a "new" row
-- and a "used" row side by side, each with its own quantity.

begin;

alter table public.inventory_items
  add column if not exists condition text not null default 'new';

alter table public.inventory_items
  drop constraint if exists inventory_items_condition_check;

alter table public.inventory_items
  add constraint inventory_items_condition_check check (condition in ('new', 'used'));

comment on column public.inventory_items.condition is
  'Physical condition of this stock row: new (unused, still boxed) or used. Rows for the same item name/room can differ in condition so each is tracked separately.';

commit;
