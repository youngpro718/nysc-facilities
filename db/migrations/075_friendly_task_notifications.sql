-- Notifications for staff_task transitions: use friendly user-facing words,
-- a sensible title-or-description fallback (the new Make a Request form
-- doesn't set a separate title — it derives one from the description), and
-- route to /my-requests instead of the now-redirected /my-activity.

CREATE OR REPLACE FUNCTION public.notify_user_on_staff_task_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  display_title text;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.requested_by IS NOT NULL THEN
    display_title := NULLIF(trim(COALESCE(NEW.title, '')), '');
    IF display_title IS NULL THEN
      display_title := left(COALESCE(NEW.description, 'your request'), 60);
    END IF;

    INSERT INTO public.user_notifications (
      user_id, type, title, message, urgency, action_url, related_id
    )
    VALUES (
      NEW.requested_by,
      'staff_task_update',
      CASE
        WHEN NEW.status = 'approved' THEN 'Request approved'
        WHEN NEW.status = 'rejected' THEN 'Request not handled'
        WHEN NEW.status IN ('completed', 'done') THEN 'Request done'
        WHEN NEW.status IN ('in_progress', 'claimed') THEN 'Court aide started'
        ELSE 'Request updated'
      END,
      CASE
        WHEN NEW.status = 'approved' THEN
          format('A court aide accepted: %s', display_title)
        WHEN NEW.status = 'rejected' THEN
          format('A court aide couldn''t handle: %s%s',
                 display_title,
                 CASE WHEN NEW.rejection_reason IS NOT NULL AND trim(NEW.rejection_reason) <> ''
                      THEN ' — ' || NEW.rejection_reason
                      ELSE '' END)
        WHEN NEW.status IN ('completed', 'done') THEN
          format('Done: %s', display_title)
        WHEN NEW.status IN ('in_progress', 'claimed') THEN
          format('A court aide is on it: %s', display_title)
        WHEN NEW.status = 'cancelled' THEN
          format('Cancelled: %s', display_title)
        ELSE
          format('%s — status updated', display_title)
      END,
      CASE WHEN NEW.status = 'rejected' THEN 'high' ELSE 'medium' END,
      '/my-requests?focus=' || NEW.id,
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Admin notification for new Make a Request submissions: previously the
-- title was 'New Task Request: <name>' which read as a debug line. Move to
-- 'New request from <name>' and prefer first_name + last_name when full_name
-- is null, falling back to the email part before the @ only as a last resort.

CREATE OR REPLACE FUNCTION public.notify_admin_on_staff_task_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requester_name text;
  requester_email text;
BEGIN
  IF NEW.is_request = true AND NEW.status = 'pending_approval' THEN
    SELECT
      COALESCE(
        NULLIF(trim(full_name), ''),
        NULLIF(trim(concat_ws(' ', first_name, last_name)), ''),
        split_part(COALESCE(email, ''), '@', 1),
        'Unknown user'
      ),
      email
    INTO requester_name, requester_email
    FROM public.profiles WHERE id = NEW.requested_by;

    INSERT INTO public.admin_notifications (
      notification_type,
      title,
      message,
      urgency,
      metadata,
      related_table,
      related_id
    )
    VALUES (
      'new_issue',
      CASE
        WHEN NEW.title = 'Room Assignment Request'
          THEN format('Room request from %s', COALESCE(requester_name, 'Unknown user'))
        ELSE format('New request from %s', COALESCE(requester_name, 'Unknown user'))
      END,
      COALESCE(NEW.description, NEW.title),
      'medium',
      jsonb_build_object(
        'action_url',
        CASE
          WHEN NEW.title = 'Room Assignment Request'
            THEN '/access-assignments?assign_user=' || NEW.requested_by
          ELSE '/tasks'
        END,
        'task_id', NEW.id,
        'requester_id', NEW.requested_by,
        'requester_name', requester_name,
        'requester_email', requester_email
      ),
      'staff_tasks',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;
