-- keys_elevator_passes.sql
-- Unify elevator pass assignments view and add deactivation audit trigger on return
-- Adjust thresholds or column names if your schema differs.

BEGIN;

-- 1) View: elevator_pass_assignments
-- Source of truth: key_assignments joined to keys (is_passkey) and occupants.
-- Only active (returned_at IS NULL). Adds days_since_assigned and is_overdue.
DROP VIEW IF EXISTS public.elevator_pass_assignments CASCADE;
CREATE VIEW public.elevator_pass_assignments AS
SELECT
  ka.id                         AS assignment_id,
  ka.key_id,
  ka.occupant_id,
  ka.assigned_at,
  ka.returned_at,
  ka.status,
  ka.return_reason,
  ka.is_spare,
  ka.spare_key_reason,
  k.name                        AS key_name,
  o.first_name,
  o.last_name,
  o.department,
  o.email,
  -- Compute days and overdue (30-day threshold by default)
  GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (now() AT TIME ZONE 'utc' - ka.assigned_at)) / 86400))::int AS days_since_assigned,
  (GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (now() AT TIME ZONE 'utc' - ka.assigned_at)) / 86400))::int > 30)          AS is_overdue
FROM public.key_assignments ka
JOIN public.keys k ON k.id = ka.key_id AND k.is_passkey = TRUE
LEFT JOIN public.occupants o ON o.id = ka.occupant_id
WHERE ka.returned_at IS NULL
ORDER BY ka.assigned_at DESC;

COMMENT ON VIEW public.elevator_pass_assignments IS 'Active elevator pass assignments unified view over key_assignments + keys.is_passkey = true + occupants';

-- 2) Trigger: when a passkey assignment is returned, log a deactivation audit entry
-- This supports the policy that passes are turned off on return.

-- Safety: create function idempotently
CREATE OR REPLACE FUNCTION public.fn_log_pass_deactivation_on_return()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_passkey boolean;
BEGIN
  -- Only act when returned_at transitions from NULL to NOT NULL
  IF (TG_OP = 'UPDATE' AND NEW.returned_at IS NOT NULL AND (OLD.returned_at IS NULL OR NEW.returned_at <> OLD.returned_at)) THEN
    -- Confirm the key is a passkey
    SELECT is_passkey INTO v_is_passkey FROM public.keys WHERE id = NEW.key_id;
    IF COALESCE(v_is_passkey, FALSE) THEN
      -- Insert audit log indicating system deactivation
      INSERT INTO public.key_audit_logs (key_id, action_type, performed_by, details, created_at)
      VALUES (
        NEW.key_id,
        'deactivated',
        NULL, -- performed_by system
        jsonb_build_object(
          'reason', COALESCE(NEW.return_reason, 'normal_return'),
          'assignment_id', NEW.id,
          'event', 'auto_deactivate_on_return'
        ),
        now()
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_pass_deactivation_on_return ON public.key_assignments;
CREATE TRIGGER trg_log_pass_deactivation_on_return
AFTER UPDATE OF returned_at ON public.key_assignments
FOR EACH ROW
EXECUTE FUNCTION public.fn_log_pass_deactivation_on_return();

COMMIT;
