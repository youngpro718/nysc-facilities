-- 066: Issue history + notifications wiring, and a 'critical' priority level.
--
-- Two functions existed but were attached to NO trigger because they referenced
-- columns that don't exist on the current `issues` table:
--   * track_issue_history()        -> used NEW.assignee_id (real column: assigned_to)
--   * handle_issue_notifications()  -> used NEW.issue_number (no such column)
-- As a result the History tab was always empty and issue reports notified no one.
-- This migration fixes both against the real schema, wires their triggers, adds
-- room-occupant alerts, and introduces a 'critical' priority so genuinely critical
-- events are categorizable and filterable.

-- ---------------------------------------------------------------------------
-- D: allow issues to be flagged 'critical'
-- ---------------------------------------------------------------------------
ALTER TYPE issue_priority_enum ADD VALUE IF NOT EXISTS 'critical' AFTER 'high';

-- ---------------------------------------------------------------------------
-- B: populate issue_history on status change / resolution
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.track_issue_history()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF (TG_OP = 'UPDATE') THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO issue_history (
        issue_id, action_type, performed_by, previous_status, new_status, action_details
      ) VALUES (
        NEW.id, 'status_change', auth.uid(), OLD.status, NEW.status,
        jsonb_build_object('priority', NEW.priority, 'assigned_to', NEW.assigned_to)
      );
    END IF;

    IF NEW.resolution_type IS NOT NULL AND OLD.resolution_type IS NULL THEN
      INSERT INTO issue_history (
        issue_id, action_type, performed_by, action_details
      ) VALUES (
        NEW.id, 'resolution', auth.uid(),
        jsonb_build_object('resolution_type', NEW.resolution_type, 'resolution_notes', NEW.resolution_notes)
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS track_issue_history_trigger ON public.issues;
CREATE TRIGGER track_issue_history_trigger
AFTER UPDATE ON public.issues
FOR EACH ROW EXECUTE FUNCTION public.track_issue_history();

-- ---------------------------------------------------------------------------
-- C: notify reporter, room occupant(s), and admins on new issue / status change.
-- Admin notifications on UPDATE are left to the existing trg_emit_issue_updates
-- to avoid duplicates; this function emits the admin 'new_issue' on INSERT.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_issue_notifications()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_ref      text := '#' || left(NEW.id::text, 8);
  v_urgency  text := CASE NEW.priority
                       WHEN 'critical' THEN 'high'
                       WHEN 'high' THEN 'high'
                       ELSE 'medium'
                     END;
  v_occupant uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.reported_by IS NOT NULL THEN
      INSERT INTO user_notifications (user_id, type, title, message, urgency, action_url, related_id, metadata)
      VALUES (
        NEW.reported_by, 'issue_update', 'Issue Submitted',
        'Your issue "' || NEW.title || '" has been submitted (' || v_ref || ').',
        v_urgency, '/my-issues', NEW.id,
        jsonb_build_object('issue_id', NEW.id, 'priority', NEW.priority, 'status', NEW.status)
      );
    END IF;

    IF NEW.room_id IS NOT NULL THEN
      FOR v_occupant IN
        SELECT DISTINCT ora.profile_id
        FROM occupant_room_assignments ora
        WHERE ora.room_id = NEW.room_id
          AND ora.profile_id IS NOT NULL
          AND ora.profile_id IS DISTINCT FROM NEW.reported_by
      LOOP
        INSERT INTO user_notifications (user_id, type, title, message, urgency, action_url, related_id, metadata)
        VALUES (
          v_occupant, 'issue_update', 'New Issue In Your Room',
          'A new issue was reported in your room: "' || NEW.title || '" (' || v_ref || ').',
          v_urgency, '/my-issues', NEW.id,
          jsonb_build_object('issue_id', NEW.id, 'priority', NEW.priority, 'room_id', NEW.room_id)
        );
      END LOOP;
    END IF;

    INSERT INTO admin_notifications (notification_type, title, message, urgency, related_table, related_id, metadata)
    VALUES (
      'new_issue', 'New Issue Reported',
      'Issue ' || v_ref || ': ' || NEW.title ||
        CASE WHEN NEW.priority = 'critical' THEN ' (CRITICAL)'
             WHEN NEW.priority = 'high' THEN ' (HIGH PRIORITY)'
             ELSE '' END,
      v_urgency, 'issues', NEW.id,
      jsonb_build_object('issue_id', NEW.id, 'priority', NEW.priority, 'reporter_id', NEW.reported_by, 'action_url', '/operations?tab=issues')
    );

  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.reported_by IS NOT NULL THEN
      INSERT INTO user_notifications (user_id, type, title, message, urgency, action_url, related_id, metadata)
      VALUES (
        NEW.reported_by, 'issue_update', 'Issue Status Updated',
        'Issue ' || v_ref || ' status changed to ' ||
          CASE NEW.status WHEN 'resolved' THEN 'Resolved'
                          WHEN 'in_progress' THEN 'In Progress'
                          ELSE NEW.status::text END || '.',
        CASE WHEN NEW.status = 'resolved' THEN 'low' ELSE 'medium' END,
        '/my-issues', NEW.id,
        jsonb_build_object('issue_id', NEW.id, 'old_status', OLD.status, 'new_status', NEW.status)
      );
    END IF;

    IF NEW.room_id IS NOT NULL THEN
      FOR v_occupant IN
        SELECT DISTINCT ora.profile_id
        FROM occupant_room_assignments ora
        WHERE ora.room_id = NEW.room_id
          AND ora.profile_id IS NOT NULL
          AND ora.profile_id IS DISTINCT FROM NEW.reported_by
      LOOP
        INSERT INTO user_notifications (user_id, type, title, message, urgency, action_url, related_id, metadata)
        VALUES (
          v_occupant, 'issue_update', 'Issue Update In Your Room',
          'Issue ' || v_ref || ' in your room changed to ' ||
            CASE NEW.status WHEN 'resolved' THEN 'Resolved'
                            WHEN 'in_progress' THEN 'In Progress'
                            ELSE NEW.status::text END || '.',
          CASE WHEN NEW.status = 'resolved' THEN 'low' ELSE 'medium' END,
          '/my-issues', NEW.id,
          jsonb_build_object('issue_id', NEW.id, 'old_status', OLD.status, 'new_status', NEW.status, 'room_id', NEW.room_id)
        );
      END LOOP;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS handle_issue_notifications_trigger ON public.issues;
CREATE TRIGGER handle_issue_notifications_trigger
AFTER INSERT OR UPDATE ON public.issues
FOR EACH ROW EXECUTE FUNCTION public.handle_issue_notifications();
