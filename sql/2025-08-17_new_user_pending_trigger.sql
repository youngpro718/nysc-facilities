-- Creates trigger to emit admin notification when a new user signs up and is pending approval
-- Depends on: public.emit_admin_notification from 2025-08-16_notifications_setup.sql

BEGIN;

-- Safe drop if re-running
DROP TRIGGER IF EXISTS trg_emit_new_user_pending ON public.profiles;
DROP FUNCTION IF EXISTS public.trg_emit_new_user_pending_admin_notification();

CREATE OR REPLACE FUNCTION public.trg_emit_new_user_pending_admin_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'pg_catalog', 'public'
AS $$
DECLARE
  v_title text;
  v_message text;
BEGIN
  -- Only when newly created profile is not yet approved
  IF (TG_OP = 'INSERT') AND (NEW.is_approved IS DISTINCT FROM TRUE) THEN
    v_title := 'New user awaiting approval';
    v_message := COALESCE(NEW.first_name || ' ' || NEW.last_name, NEW.email, NEW.id::text) || ' has signed up and is pending approval.';

    BEGIN
      PERFORM public.emit_admin_notification(
        p_type => 'new_user_pending',
        p_title => v_title,
        p_message => v_message,
        p_urgency => 'medium',
        p_related_table => 'profiles',
        p_related_id => NEW.id,
        p_metadata => jsonb_build_object(
          'target_user_id', NEW.id,
          'email', NEW.email,
          'verification_status', NEW.verification_status
        )
      );
    EXCEPTION WHEN OTHERS THEN
      -- swallow to not block signups
      NULL;
    END;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_emit_new_user_pending
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.trg_emit_new_user_pending_admin_notification();

COMMIT;
