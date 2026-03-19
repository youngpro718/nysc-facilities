-- Migration: 036_term_assignment_linkage.sql
-- Description: Link court_assignments to court_terms via term_id
--              so each term has its own snapshot of assignments.
--              Existing assignments are backfilled to the most recent term.
-- Date: 2026-03-18

BEGIN;

-- 1. Add term_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'court_assignments'
      AND column_name = 'term_id'
  ) THEN
    ALTER TABLE public.court_assignments
      ADD COLUMN term_id uuid REFERENCES public.court_terms(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 2. Backfill: assign all existing rows to the most recent term
UPDATE public.court_assignments
SET term_id = (
  SELECT id FROM public.court_terms
  ORDER BY start_date DESC
  LIMIT 1
)
WHERE term_id IS NULL;

-- 3. Index for fast term-based lookups
CREATE INDEX IF NOT EXISTS idx_court_assignments_term_id
  ON public.court_assignments(term_id);

-- 4. RPC to duplicate assignments when creating a new term (copy-forward)
CREATE OR REPLACE FUNCTION public.copy_term_assignments(
  p_source_term_id uuid,
  p_target_term_id uuid
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  copied_count integer;
BEGIN
  INSERT INTO public.court_assignments (
    room_id, part, justice, tel, fax, sergeant, clerks,
    calendar_day, sort_order, term_id
  )
  SELECT
    room_id, part, justice, tel, fax, sergeant, clerks,
    calendar_day, sort_order, p_target_term_id
  FROM public.court_assignments
  WHERE term_id = p_source_term_id;

  GET DIAGNOSTICS copied_count = ROW_COUNT;
  RETURN copied_count;
END;
$$;

COMMIT;
