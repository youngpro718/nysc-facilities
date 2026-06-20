-- Per-item packaging metadata. The unit column already carries the smallest-unit
-- label (battery, sheet, pen). pack_size says how many of those a single pack
-- contains, so the catalog and cart can display the pack equivalent ("12 pens
-- = 1 pack of 12") without ever doing math in the requester's head. NULL means
-- the item is sold loose, with no pack.
--
-- The packaging_note is admin-only freeform (e.g., "1 case = 24 boxes x 8
-- packs / 768 batteries") used for restock planning, never user-facing.
--
-- minimum_quantity already exists on the table and continues to drive low-stock
-- alerts; reorder math stays in smallest units.

ALTER TABLE public.inventory_items
  ADD COLUMN IF NOT EXISTS pack_size integer,
  ADD COLUMN IF NOT EXISTS packaging_note text;

ALTER TABLE public.inventory_items
  DROP CONSTRAINT IF EXISTS inventory_items_pack_size_positive;

ALTER TABLE public.inventory_items
  ADD CONSTRAINT inventory_items_pack_size_positive
    CHECK (pack_size IS NULL OR pack_size > 0);
