-- keys_auto_return_helpers.sql
-- Helper function to auto-return and log deactivation for all active elevator passes
-- associated with an occupant. Intended to be called from triggers on status changes
-- (promotion, resignation, termination, etc.).

BEGIN;

-- Function: fn_return_and_deactivate_passes_for_occupant
-- Marks active passkey assignments returned, sets return_reason, and logs 'returned' and 'deactivated'.
CREATE OR REPLACE FUNCTION public.fn_return_and_deactivate_passes_for_occupant(
  p_occupant_id uuid,
  p_reason text DEFAULT 'status_change'
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count int := 0;
  r record;
BEGIN
  -- Loop over all active passkey assignments for this occupant
  FOR r IN
    SELECT ka.id AS assignment_id, ka.key_id
    FROM public.key_assignments ka
    JOIN public.keys k ON k.id = ka.key_id AND k.is_passkey = TRUE
    WHERE ka.occupant_id = p_occupant_id
      AND ka.returned_at IS NULL
  LOOP
    -- Mark as returned with reason
    UPDATE public.key_assignments
    SET returned_at = now(),
        return_reason = COALESCE(p_reason, 'status_change')
    WHERE id = r.assignment_id;

    -- Audit: returned
    INSERT INTO public.key_audit_logs (key_id, action_type, performed_by, details, created_at)
    VALUES (
      r.key_id,
      'returned',
      NULL,
      jsonb_build_object(
        'reason', COALESCE(p_reason, 'status_change'),
        'assignment_id', r.assignment_id,
        'event', 'auto_return_on_status_change'
      ),
      now()
    );

    -- Audit: deactivated (system)
    INSERT INTO public.key_audit_logs (key_id, action_type, performed_by, details, created_at)
    VALUES (
      r.key_id,
      'deactivated',
      NULL,
      jsonb_build_object(
        'reason', COALESCE(p_reason, 'status_change'),
        'assignment_id', r.assignment_id,
        'event', 'auto_deactivate_on_status_change'
      ),
      now()
    );

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

COMMENT ON FUNCTION public.fn_return_and_deactivate_passes_for_occupant(uuid, text)
IS 'Auto-returns all active elevator pass assignments for the occupant and logs returned+deactivated audit entries. Returns the number of assignments affected.';

-- Optional template trigger (COMMENTED):
-- Replace table/column names per your schema, then uncomment.
/*
CREATE OR REPLACE FUNCTION public.fn_trg_auto_return_on_profile_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_occupant_id uuid;
  v_changed boolean := false;
BEGIN
  -- Example conditions: adjust columns/values per your schema
  IF TG_OP = 'UPDATE' THEN
    v_changed := (NEW.employment_status IS DISTINCT FROM OLD.employment_status)
                 OR (NEW.role IS DISTINCT FROM OLD.role);
  END IF;

  IF v_changed THEN
    -- Map profile to occupant if applicable; replace this with your mapping
    -- SELECT o.id INTO v_occupant_id FROM public.occupants o WHERE o.profile_id = NEW.id;

    -- If you store status directly on occupants, you can attach the trigger there and
    -- set v_occupant_id := NEW.id;

    IF v_occupant_id IS NOT NULL THEN
      PERFORM public.fn_return_and_deactivate_passes_for_occupant(v_occupant_id, 'status_change');
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Example trigger on profiles table (adjust name/table):
-- DROP TRIGGER IF EXISTS trg_auto_return_on_profile_status_change ON public.profiles;
-- CREATE TRIGGER trg_auto_return_on_profile_status_change
-- AFTER UPDATE ON public.profiles
-- FOR EACH ROW
-- EXECUTE FUNCTION public.fn_trg_auto_return_on_profile_status_change();
*/

COMMIT;
