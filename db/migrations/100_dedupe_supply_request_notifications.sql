-- 100_dedupe_supply_request_notifications.sql
-- Investigated (2026-07-09): every supply_requests status change was
-- producing 2 duplicate user_notifications rows, and the transition to
-- 'completed'/'rejected' produced 3. Root cause confirmed via pg_trigger +
-- direct data inspection (identical created_at timestamps, same
-- user_id/related_id, same transaction) — THREE independent trigger
-- functions on supply_requests each insert their own near-identical
-- user_notifications row on the same status UPDATE:
--
--   1. handle_supply_request_status_change_trigger (BEFORE UPDATE)
--      -> handle_supply_request_status_change() — inserts for every status
--         except 'fulfilled' (generic copy), ALSO sets approved_at/approved_by.
--   2. supply_request_status_change_trigger (AFTER UPDATE OF status)
--      -> notify_supply_request_status_change() — inserts for most statuses
--         (nicer per-status copy), ALSO logs supply_request_status_history.
--   3. trigger_supply_request_completion (AFTER UPDATE)
--      -> notify_supply_request_completion() — inserts ONLY for
--         'completed'/'rejected', 100% redundant with #2's handling of the
--         same two statuses, no other side effects.
--
-- Fix: keep exactly one notifier (#2 — most complete status coverage +
-- audit trail). #2 gains the 'under_review' case and a generic fallback so
-- it's a strict superset of #1's coverage (nothing lost). #1 keeps its
-- approved_at/approved_by side effect but no longer inserts a notification.
-- #3 is fully redundant with #2 and is dropped outright (trigger + function).
--
-- No frontend code branches on user_notifications.type or title for these
-- rows (grepped — NotificationDropdown/useNotifications render generically),
-- so this is safe to consolidate without a UI change.

-- 1. notify_supply_request_status_change(): add 'under_review' + explicit
--    'fulfilled' skip + generic fallback, so it fully covers what #1 used to.
create or replace function public.notify_supply_request_status_change()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
DECLARE
  v_title TEXT;
  v_message TEXT;
  v_urgency TEXT := 'medium';
BEGIN
  -- Only trigger on status changes
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Build notification based on new status
  CASE NEW.status
    WHEN 'fulfilled' THEN
      -- Fulfillment notifications are handled by complete_supply_request_work().
      RETURN NEW;
    WHEN 'under_review' THEN
      v_title := 'Supply Request Under Review';
      v_message := 'Your supply request "' || COALESCE(NEW.title, 'Untitled') || '" is now under review.';
    WHEN 'pending_approval' THEN
      v_title := 'Supply Request Needs Approval';
      v_message := 'Request "' || COALESCE(NEW.title, 'Untitled') || '" requires approval for restricted items.';
      v_urgency := 'high';
      -- Notify admins (handled separately via admin_notifications if needed)
    WHEN 'approved' THEN
      v_title := 'Supply Request Approved';
      v_message := 'Your request "' || COALESCE(NEW.title, 'Untitled') || '" has been approved.';
    WHEN 'rejected' THEN
      v_title := 'Supply Request Rejected';
      v_message := 'Your request "' || COALESCE(NEW.title, 'Untitled') || '" was rejected. Reason: ' || COALESCE(NEW.rejection_reason, 'Not specified');
      v_urgency := 'high';
    WHEN 'received' THEN
      v_title := 'Supply Request Being Processed';
      v_message := 'Your request "' || COALESCE(NEW.title, 'Untitled') || '" has been received by the supply room.';
    WHEN 'picking' THEN
      v_title := 'Supply Request In Progress';
      v_message := 'Items for "' || COALESCE(NEW.title, 'Untitled') || '" are being picked.';
    WHEN 'ready' THEN
      v_title := 'Order Ready for Pickup!';
      v_message := 'Your order "' || COALESCE(NEW.title, 'Untitled') || '" is ready. Please pick up from the supply room.';
      v_urgency := 'high';
    WHEN 'completed' THEN
      v_title := 'Order Completed';
      v_message := 'Your order "' || COALESCE(NEW.title, 'Untitled') || '" has been completed.';
    WHEN 'cancelled' THEN
      v_title := 'Order Cancelled';
      v_message := 'Your order "' || COALESCE(NEW.title, 'Untitled') || '" has been cancelled.';
    ELSE
      -- Fallback for any other status transition (e.g. 'submitted' reached
      -- via UPDATE rather than INSERT) — matches the old
      -- handle_supply_request_status_change() generic copy so removing that
      -- trigger's insert doesn't silently drop coverage.
      v_title := 'Supply Request Updated';
      v_message := 'Your supply request "' || COALESCE(NEW.title, 'Untitled') || '" status has been updated to ' || NEW.status;
  END CASE;

  -- Insert notification for the requester
  INSERT INTO public.user_notifications (
    user_id,
    type,
    title,
    message,
    urgency,
    action_url,
    related_id,
    metadata
  ) VALUES (
    NEW.requester_id,
    'supply_request_update',
    v_title,
    v_message,
    v_urgency,
    '/request/supplies',
    NEW.id,
    jsonb_build_object('status', NEW.status, 'previous_status', OLD.status)
  );

  -- Also log to status history
  INSERT INTO public.supply_request_status_history (
    request_id,
    status,
    notes,
    changed_by,
    changed_at
  ) VALUES (
    NEW.id,
    NEW.status,
    CASE
      WHEN NEW.status = 'rejected' THEN NEW.rejection_reason
      WHEN NEW.status = 'approved' THEN NEW.approval_notes
      ELSE NULL
    END,
    COALESCE(auth.uid(), NEW.approved_by, NEW.fulfilled_by),
    NOW()
  );

  RETURN NEW;
END;
$function$;

-- 2. handle_supply_request_status_change(): drop the duplicate notification
--    insert, keep the approved_at/approved_by side effect (its real job).
create or replace function public.handle_supply_request_status_change()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
BEGIN
  -- Only process if status actually changed
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    -- User-facing notification for this transition is now owned solely by
    -- notify_supply_request_status_change() (supply_request_status_change_trigger).
    -- This trigger previously ALSO inserted a near-duplicate user_notifications
    -- row here — removed 2026-07-09 (every status change was producing 2-3
    -- duplicate notifications). This trigger still owns the approval-timestamp
    -- side effect below.

    -- Update approval timestamps
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
      NEW.approved_at = now();
      NEW.approved_by = auth.uid();
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- 3. trigger_supply_request_completion / notify_supply_request_completion():
--    100% redundant with notify_supply_request_status_change()'s 'completed'
--    and 'rejected' handling, no other side effects — drop outright.
drop trigger if exists trigger_supply_request_completion on public.supply_requests;
drop function if exists public.notify_supply_request_completion();
