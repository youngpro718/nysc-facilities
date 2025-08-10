-- Accelerate inventory search on name/description using pg_trgm GIN indexes
-- Safe to run multiple times due to IF NOT EXISTS guards

-- 1) Ensure pg_trgm extension exists
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2) Create trigram indexes for ILIKE searches
CREATE INDEX IF NOT EXISTS idx_inventory_items_name_trgm
  ON public.inventory_items USING gin (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_inventory_items_description_trgm
  ON public.inventory_items USING gin (description gin_trgm_ops);

-- 3) Optional exact-match case-insensitive helper
--    Useful if you sometimes use lower(name) = lower($1)
CREATE INDEX IF NOT EXISTS idx_inventory_items_lower_name
  ON public.inventory_items (lower(name));
