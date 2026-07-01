-- 091: bunting flag for courtrooms
--
-- Why: court officers need an at-a-glance signal for which courtrooms currently
-- have bunting (the decorative skirt around counsel tables) set up for a
-- ceremonial proceeding, so the courtroom directory can highlight it instead
-- of officers finding out in person. Write access follows the same
-- is_court_operations_manager() policy already covering the rest of the
-- court_rooms table (admin, system_admin, court_liaison/cmc) — no new RLS
-- policy needed since Postgres RLS is row-scoped, not column-scoped.

BEGIN;

ALTER TABLE public.court_rooms
  ADD COLUMN IF NOT EXISTS has_bunting boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.court_rooms.has_bunting IS
  'Whether this courtroom currently has bunting (table skirting) set up. Surfaced as a highlight in the courtroom directory.';

COMMIT;
