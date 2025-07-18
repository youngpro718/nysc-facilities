-- Create function to handle supply request fulfillment with inventory deduction
CREATE OR REPLACE FUNCTION public.fulfill_supply_request(
  p_request_id UUID,
  p_fulfillment_notes TEXT DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  request_record RECORD;
  item_record RECORD;
  insufficient_inventory BOOLEAN := FALSE;
  inventory_errors TEXT := '';
BEGIN
  -- Get the supply request details
  SELECT * INTO request_record
  FROM supply_requests
  WHERE id = p_request_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Supply request not found';
  END IF;

  IF request_record.status != 'approved' THEN
    RAISE EXCEPTION 'Supply request must be approved before fulfillment';
  END IF;

  -- Check inventory availability for all items first
  FOR item_record IN
    SELECT sri.*, ii.name as item_name, ii.quantity as available_quantity
    FROM supply_request_items sri
    JOIN inventory_items ii ON sri.item_id = ii.id
    WHERE sri.request_id = p_request_id
  LOOP
    IF COALESCE(item_record.quantity_fulfilled, item_record.quantity_approved, item_record.quantity_requested) > item_record.available_quantity THEN
      insufficient_inventory := TRUE;
      inventory_errors := inventory_errors || 
        format('Item "%s": Need %s, Available %s. ', 
          item_record.item_name,
          COALESCE(item_record.quantity_fulfilled, item_record.quantity_approved, item_record.quantity_requested),
          item_record.available_quantity
        );
    END IF;
  END LOOP;

  -- If insufficient inventory, raise exception with details
  IF insufficient_inventory THEN
    RAISE EXCEPTION 'Insufficient inventory: %', inventory_errors;
  END IF;

  -- Process each item: deduct inventory and create transaction records
  FOR item_record IN
    SELECT sri.*, ii.name as item_name
    FROM supply_request_items sri
    JOIN inventory_items ii ON sri.item_id = ii.id
    WHERE sri.request_id = p_request_id
  LOOP
    DECLARE
      quantity_to_fulfill INTEGER;
    BEGIN
      -- Use fulfilled quantity if specified, otherwise approved, otherwise requested
      quantity_to_fulfill := COALESCE(
        item_record.quantity_fulfilled,
        item_record.quantity_approved,
        item_record.quantity_requested
      );

      -- Deduct from inventory
      UPDATE inventory_items
      SET 
        quantity = quantity - quantity_to_fulfill,
        updated_at = now()
      WHERE id = item_record.item_id;

      -- Create inventory transaction record
      INSERT INTO inventory_item_transactions (
        item_id,
        transaction_type,
        quantity,
        previous_quantity,
        new_quantity,
        notes,
        performed_by
      ) VALUES (
        item_record.item_id,
        'remove',
        quantity_to_fulfill,
        (SELECT quantity + quantity_to_fulfill FROM inventory_items WHERE id = item_record.item_id),
        (SELECT quantity FROM inventory_items WHERE id = item_record.item_id),
        format('Supply request fulfillment - Request #%s: %s', p_request_id, request_record.title),
        auth.uid()
      );

      -- Update the supply request item with actual fulfilled quantity
      UPDATE supply_request_items
      SET quantity_fulfilled = quantity_to_fulfill
      WHERE id = item_record.id;
    END;
  END LOOP;

  -- Update the supply request status
  UPDATE supply_requests
  SET 
    status = 'fulfilled',
    fulfilled_by = auth.uid(),
    fulfilled_at = now(),
    fulfillment_notes = p_fulfillment_notes,
    updated_at = now()
  WHERE id = p_request_id;
END;
$$;

-- Update the existing supply request status change trigger to use the new function
CREATE OR REPLACE FUNCTION public.handle_supply_request_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only process if status actually changed
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    -- Don't allow direct status change to fulfilled - must use fulfill_supply_request function
    IF NEW.status = 'fulfilled' AND OLD.status != 'fulfilled' THEN
      RAISE EXCEPTION 'Use fulfill_supply_request() function to fulfill requests and handle inventory deduction';
    END IF;

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

    -- Update approval timestamps (not fulfillment - that's handled by fulfill_supply_request)
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
      NEW.approved_at = now();
      NEW.approved_by = auth.uid();
    END IF;
  END IF;

  RETURN NEW;
END;
$$;