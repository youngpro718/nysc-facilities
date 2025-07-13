-- Fix function search_path security warnings by setting explicit search_path

-- Update update_key_request_timestamp function to set search_path
CREATE OR REPLACE FUNCTION public.update_key_request_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$function$;

-- Update create_user_notification function to set search_path
CREATE OR REPLACE FUNCTION public.create_user_notification(
  p_user_id uuid, 
  p_type text, 
  p_title text, 
  p_message text, 
  p_urgency text DEFAULT 'medium'::text, 
  p_action_url text DEFAULT NULL::text, 
  p_metadata jsonb DEFAULT '{}'::jsonb, 
  p_related_id uuid DEFAULT NULL::uuid
)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO user_notifications (
    user_id, type, title, message, urgency, action_url, metadata, related_id
  ) VALUES (
    p_user_id, p_type, p_title, p_message, p_urgency, p_action_url, p_metadata, p_related_id
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$function$;

-- Update advance_key_order_status function to set search_path
CREATE OR REPLACE FUNCTION public.advance_key_order_status(
  p_order_id uuid, 
  p_fulfilled_by uuid DEFAULT NULL::uuid, 
  p_notes text DEFAULT NULL::text
)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_status TEXT;
  new_status TEXT;
  order_user_id UUID;
BEGIN
  -- Get current status and user_id
  SELECT status, user_id INTO current_status, order_user_id
  FROM key_orders WHERE id = p_order_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Key order not found';
  END IF;
  
  -- Determine next status
  CASE current_status
    WHEN 'pending_fulfillment' THEN new_status := 'in_progress';
    WHEN 'in_progress' THEN new_status := 'ready_for_pickup';
    WHEN 'ready_for_pickup' THEN new_status := 'completed';
    ELSE RAISE EXCEPTION 'Cannot advance from status: %', current_status;
  END CASE;
  
  -- Update the order
  UPDATE key_orders 
  SET 
    status = new_status,
    updated_at = CURRENT_TIMESTAMP,
    completed_at = CASE WHEN new_status = 'completed' THEN CURRENT_TIMESTAMP ELSE NULL END,
    fulfilled_by = COALESCE(p_fulfilled_by, fulfilled_by),
    fulfillment_notes = COALESCE(p_notes, fulfillment_notes)
  WHERE id = p_order_id;
  
  -- Create user notification for status updates
  IF new_status = 'ready_for_pickup' THEN
    INSERT INTO user_notifications (
      user_id, type, title, message, urgency, action_url, related_id, metadata
    ) VALUES (
      order_user_id,
      'key_request_fulfilled',
      'Key Ready for Pickup',
      'Your key order is ready for pickup. Please visit the facilities office.',
      'high',
      '/my-requests',
      p_order_id,
      jsonb_build_object('order_id', p_order_id, 'status', new_status)
    );
  ELSIF new_status = 'completed' THEN
    INSERT INTO user_notifications (
      user_id, type, title, message, urgency, action_url, related_id, metadata
    ) VALUES (
      order_user_id,
      'key_request_fulfilled',
      'Key Order Completed',
      'Your key order has been completed. Thank you!',
      'low',
      '/my-requests',
      p_order_id,
      jsonb_build_object('order_id', p_order_id, 'status', new_status)
    );
  END IF;
END;
$function$;