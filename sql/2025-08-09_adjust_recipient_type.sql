-- Adjust recipient_type allowed values to ('occupant','security','office')
-- Drop existing unnamed constraint (if any) and add a named one for manageability
DO $$
DECLARE
  conname text;
BEGIN
  SELECT conname INTO conname
  FROM pg_constraint
  WHERE conrelid = 'public.key_assignments'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%recipient_type%CHECK%';

  IF conname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.key_assignments DROP CONSTRAINT %I', conname);
  END IF;

  -- Recreate with the new allowed set
  ALTER TABLE public.key_assignments
    ADD CONSTRAINT key_assignments_recipient_type_check
    CHECK (recipient_type IS NULL OR recipient_type IN ('occupant','security','office'));
END $$;
