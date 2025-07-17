-- Create triggers for issue notifications to users and admins
CREATE OR REPLACE FUNCTION public.handle_issue_notifications()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Create user notification for issue updates
  IF TG_OP = 'INSERT' THEN
    -- Notify the reporter about issue creation
    INSERT INTO user_notifications (
      user_id,
      type,
      title,
      message,
      urgency,
      action_url,
      related_id,
      metadata
    ) VALUES (
      NEW.reported_by,
      'issue_update',
      'Issue Submitted',
      'Your issue "' || NEW.title || '" has been submitted and assigned ID #' || NEW.issue_number,
      CASE NEW.priority
        WHEN 'critical' THEN 'high'
        WHEN 'high' THEN 'high'
        ELSE 'medium'
      END,
      '/issues/' || NEW.id,
      NEW.id,
      jsonb_build_object(
        'issue_id', NEW.id,
        'issue_number', NEW.issue_number,
        'priority', NEW.priority,
        'status', NEW.status
      )
    );

    -- Create admin notification for new issue
    INSERT INTO admin_notifications (
      notification_type,
      title,
      message,
      urgency,
      related_table,
      related_id,
      metadata
    ) VALUES (
      'new_issue',
      'New Issue Reported',
      'Issue #' || NEW.issue_number || ': ' || NEW.title || 
      CASE WHEN NEW.priority = 'critical' THEN ' (CRITICAL)' 
           WHEN NEW.priority = 'high' THEN ' (HIGH PRIORITY)'
           ELSE ''
      END,
      CASE NEW.priority
        WHEN 'critical' THEN 'high'
        WHEN 'high' THEN 'high'
        ELSE 'medium'
      END,
      'issues',
      NEW.id,
      jsonb_build_object(
        'issue_id', NEW.id,
        'issue_number', NEW.issue_number,
        'priority', NEW.priority,
        'reporter_id', NEW.reported_by
      )
    );
    
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    -- Notify reporter about status changes
    INSERT INTO user_notifications (
      user_id,
      type,
      title,
      message,
      urgency,
      action_url,
      related_id,
      metadata
    ) VALUES (
      NEW.reported_by,
      'issue_update',
      'Issue Status Updated',
      'Issue #' || NEW.issue_number || ' status changed to ' || 
      CASE NEW.status
        WHEN 'resolved' THEN 'Resolved'
        WHEN 'in_progress' THEN 'In Progress'
        WHEN 'pending' THEN 'Pending Review'
        ELSE NEW.status
      END,
      CASE 
        WHEN NEW.status = 'resolved' THEN 'low'
        WHEN NEW.status = 'in_progress' THEN 'medium'
        ELSE 'medium'
      END,
      '/issues/' || NEW.id,
      NEW.id,
      jsonb_build_object(
        'issue_id', NEW.id,
        'issue_number', NEW.issue_number,
        'old_status', OLD.status,
        'new_status', NEW.status
      )
    );

    -- Notify admin about status changes (if not resolved)
    IF NEW.status != 'resolved' THEN
      INSERT INTO admin_notifications (
        notification_type,
        title,
        message,
        urgency,
        related_table,
        related_id,
        metadata
      ) VALUES (
        'issue_status_change',
        'Issue Status Updated',
        'Issue #' || NEW.issue_number || ' status changed to ' || NEW.status,
        'medium',
        'issues',
        NEW.id,
        jsonb_build_object(
          'issue_id', NEW.id,
          'issue_number', NEW.issue_number,
          'old_status', OLD.status,
          'new_status', NEW.status
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for issues
DROP TRIGGER IF EXISTS trigger_issue_notifications ON issues;
CREATE TRIGGER trigger_issue_notifications
  AFTER INSERT OR UPDATE ON issues
  FOR EACH ROW
  EXECUTE FUNCTION handle_issue_notifications();

-- Enhanced supply request notifications for real-time
CREATE OR REPLACE FUNCTION public.handle_supply_request_notifications_realtime()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only process if status actually changed
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    -- Create notification for status changes (this will be picked up by real-time)
    INSERT INTO user_notifications (
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
      CASE NEW.status
        WHEN 'under_review' THEN 'Supply Request Under Review'
        WHEN 'approved' THEN 'Supply Request Approved'
        WHEN 'rejected' THEN 'Supply Request Rejected'
        WHEN 'fulfilled' THEN 'Supply Request Fulfilled'
        WHEN 'cancelled' THEN 'Supply Request Cancelled'
        ELSE 'Supply Request Updated'
      END,
      CASE NEW.status
        WHEN 'under_review' THEN 'Your supply request "' || NEW.title || '" is now under review.'
        WHEN 'approved' THEN 'Your supply request "' || NEW.title || '" has been approved and will be fulfilled soon.'
        WHEN 'rejected' THEN 'Your supply request "' || NEW.title || '" has been rejected. ' || COALESCE('Reason: ' || NEW.approval_notes, '')
        WHEN 'fulfilled' THEN 'Your supply request "' || NEW.title || '" has been fulfilled. ' || COALESCE('Notes: ' || NEW.fulfillment_notes, '')
        WHEN 'cancelled' THEN 'Your supply request "' || NEW.title || '" has been cancelled.'
        ELSE 'Your supply request "' || NEW.title || '" status has been updated to ' || NEW.status
      END,
      CASE NEW.status
        WHEN 'approved' THEN 'medium'
        WHEN 'rejected' THEN 'high'
        WHEN 'fulfilled' THEN 'low'
        ELSE 'medium'
      END,
      '/my-requests',
      NEW.id,
      jsonb_build_object(
        'request_id', NEW.id,
        'old_status', OLD.status,
        'new_status', NEW.status,
        'request_type', 'supply'
      )
    );
  END IF;

  RETURN NEW;
END;
$function$;

-- Create trigger for supply requests
DROP TRIGGER IF EXISTS trigger_supply_request_notifications_realtime ON supply_requests;
CREATE TRIGGER trigger_supply_request_notifications_realtime
  AFTER UPDATE ON supply_requests
  FOR EACH ROW
  EXECUTE FUNCTION handle_supply_request_notifications_realtime();