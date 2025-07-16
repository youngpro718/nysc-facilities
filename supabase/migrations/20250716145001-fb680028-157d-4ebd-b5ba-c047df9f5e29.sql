-- Fix search path for supply request functions
CREATE OR REPLACE FUNCTION public.update_supply_request_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.handle_supply_request_status_change()
RETURNS TRIGGER AS $$
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

    -- Notify supply department for new requests
    IF NEW.status = 'pending' AND OLD.status != 'pending' THEN
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
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.validate_supply_request_inventory()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if requested quantity is available
  IF NEW.quantity_requested > (
    SELECT COALESCE(quantity, 0) 
    FROM inventory_items 
    WHERE id = NEW.item_id
  ) THEN
    RAISE EXCEPTION 'Insufficient inventory for item. Available: %, Requested: %', 
      (SELECT COALESCE(quantity, 0) FROM inventory_items WHERE id = NEW.item_id),
      NEW.quantity_requested;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;