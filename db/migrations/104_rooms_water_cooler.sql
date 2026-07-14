-- 104: water cooler flag for rooms
--
-- Why: facilities is supposed to have a water cooler in every room but only
-- has them in certain sections. Tracking presence per room lets the Spaces
-- directory answer "where do we have coolers?" with a quick filter instead of
-- someone walking the floors. Toggled from the room card by space managers;
-- write access follows the existing row-level policies on rooms (RLS is
-- row-scoped, not column-scoped — no new policy needed).

BEGIN;

ALTER TABLE public.rooms
  ADD COLUMN IF NOT EXISTS has_water_cooler boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.rooms.has_water_cooler IS
  'Whether this room currently has a water cooler. Surfaced as a badge on room cards and a quick filter in the Spaces directory.';

COMMIT;
