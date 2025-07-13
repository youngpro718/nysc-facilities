-- Create function to advance key order to next status
CREATE OR REPLACE FUNCTION advance_key_order_status(
  p_order_id UUID,
  p_fulfilled_by UUID DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_status TEXT;
  new_status TEXT;
  order_user_id UUID;
BEGIN
  -- Get current status and user_id
  SELECT status, user_id INTO current_status, user_id
  FROM key_orders WHERE id = p_order_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Key order not found';
  END IF;
  
  -- Determine next status
  CASE current_status
    WHEN 'ordered' THEN new_status := 'received';
    WHEN 'received' THEN new_status := 'ready_for_pickup';
    WHEN 'ready_for_pickup' THEN new_status := 'delivered';
    ELSE RAISE EXCEPTION 'Cannot advance from status: %', current_status;
  END CASE;
  
  -- Update the order
  UPDATE key_orders 
  SET 
    status = new_status,
    updated_at = CURRENT_TIMESTAMP,
    received_at = CASE WHEN new_status = 'received' THEN CURRENT_TIMESTAMP ELSE received_at END
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
  ELSIF new_status = 'delivered' THEN
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
$$;