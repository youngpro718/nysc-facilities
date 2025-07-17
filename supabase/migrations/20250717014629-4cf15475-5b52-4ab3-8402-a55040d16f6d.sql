-- Create function to handle new supply requests (INSERT trigger)
CREATE OR REPLACE FUNCTION public.handle_new_supply_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Create admin notification for new supply request
  INSERT INTO admin_notifications (
    notification_type,
    title,
    message,
    urgency,
    related_table,
    related_id,
    metadata
  ) VALUES (
    'new_supply_request',
    'New Supply Request',
    'A new supply request "' || NEW.title || '" has been submitted by ' || 
    COALESCE(
      (SELECT first_name || ' ' || last_name FROM profiles WHERE id = NEW.requester_id),
      'Unknown User'
    ),
    NEW.priority,
    'supply_requests',
    NEW.id,
    jsonb_build_object(
      'request_id', NEW.id,
      'requester_id', NEW.requester_id,
      'priority', NEW.priority
    )
  );

  -- Create user notifications for Supply and Administration department users
  INSERT INTO user_notifications (
    user_id,
    type,
    title,
    message,
    urgency,
    action_url,
    related_id,
    metadata
  )
  SELECT 
    p.id,
    'new_supply_request',
    'New Supply Request',
    'A new supply request "' || NEW.title || '" has been submitted by ' || 
    COALESCE(req_profile.first_name || ' ' || req_profile.last_name, 'Unknown User'),
    NEW.priority,
    '/admin/supply-requests',
    NEW.id,
    jsonb_build_object(
      'request_id', NEW.id,
      'requester_id', NEW.requester_id,
      'priority', NEW.priority
    )
  FROM profiles p
  LEFT JOIN profiles req_profile ON req_profile.id = NEW.requester_id
  WHERE p.department IN ('Supply', 'Administration');

  RETURN NEW;
END;
$function$;

-- Update existing function to remove problematic pending logic
CREATE OR REPLACE FUNCTION public.handle_supply_request_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only process if status actually changed
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    -- Create notification for status changes
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

    -- Update approval/fulfillment timestamps
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
      NEW.approved_at = now();
      NEW.approved_by = auth.uid();
    END IF;

    IF NEW.status = 'fulfilled' AND OLD.status != 'fulfilled' THEN
      NEW.fulfilled_at = now();
      NEW.fulfilled_by = auth.uid();
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- Create INSERT trigger for new supply requests
DROP TRIGGER IF EXISTS handle_new_supply_request_trigger ON supply_requests;
CREATE TRIGGER handle_new_supply_request_trigger
  AFTER INSERT ON supply_requests
  FOR EACH ROW EXECUTE FUNCTION handle_new_supply_request();