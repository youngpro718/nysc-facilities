-- 102_fix_staff_task_history_actor.sql
--
-- Fix: log_staff_task_changes() attributed staff_task_history.performed_by to
-- COALESCE(NEW.claimed_by, NEW.approved_by, NEW.created_by). When a staff member
-- acts on a task they did not create/claim/approve (e.g. an aide RELEASING a
-- claim — which nulls claimed_by — or an admin cancelling a task created by
-- someone else), performed_by resolved to created_by, which is NOT auth.uid().
-- The staff_task_history_insert RLS policy requires performed_by = auth.uid(),
-- so the trigger's INSERT raised 42501 and the whole task UPDATE was rolled back
-- with a misleading "You do not have permission" error.
--
-- Correct attribution is the actor actually performing the change: auth.uid().
-- Fall back to the previous columns only when there is no auth context
-- (service-role / SQL / migration writes) so system-driven history still logs.
--
-- Additionally the function is now SECURITY DEFINER. History logging is a trusted
-- system path: it only ever inserts rows derived from the triggering staff_tasks
-- change (which already had to pass staff_tasks' own RLS to happen). The
-- staff_task_history_insert policy re-checks task ownership against the row, but
-- as an AFTER UPDATE trigger it sees the POST-update row — so releasing a claim
-- (claimed_by -> NULL) makes the just-acting user fail the ownership re-check and
-- the audit INSERT is rejected. Decoupling "can you change this task" (enforced by
-- staff_tasks RLS) from "the system records that you did" (should always succeed)
-- is the correct model; SECURITY DEFINER bypasses the history table's user RLS
-- while auth.uid() still records the true actor.

CREATE OR REPLACE FUNCTION public.log_staff_task_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO staff_task_history (task_id, action, performed_by, new_values)
    VALUES (NEW.id, 'created', COALESCE(auth.uid(), NEW.created_by), to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    -- Log status changes
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO staff_task_history (task_id, action, performed_by, old_values, new_values, notes)
      VALUES (
        NEW.id,
        CASE
          WHEN NEW.status = 'approved' THEN 'approved'
          WHEN NEW.status = 'rejected' THEN 'rejected'
          WHEN NEW.status = 'claimed' THEN 'claimed'
          WHEN NEW.status = 'in_progress' THEN 'started'
          WHEN NEW.status = 'completed' THEN 'completed'
          WHEN NEW.status = 'cancelled' THEN 'cancelled'
          ELSE 'status_changed'
        END,
        COALESCE(auth.uid(), NEW.claimed_by, NEW.approved_by, NEW.created_by),
        jsonb_build_object('status', OLD.status),
        jsonb_build_object('status', NEW.status),
        NEW.completion_notes
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;
