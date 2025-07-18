-- Remove the old trigger that blocks status changes
DROP TRIGGER IF EXISTS handle_supply_request_status_change_trigger ON supply_requests;

-- Update the trigger function to work with our new simplified workflow
CREATE OR REPLACE FUNCTION public.handle_supply_request_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only process if status actually changed
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    -- Allow the new simplified workflow to handle fulfillment directly
    -- Remove the old restriction that forced use of fulfill_supply_request()
    
    -- Create notification for status changes (but not for fulfillment - that's handled by complete_supply_request_work)
    IF NEW.status != 'fulfilled' THEN
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
          WHEN 'cancelled' THEN 'Supply Request Cancelled'
          ELSE 'Supply Request Updated'
        END,
        CASE NEW.status
          WHEN 'under_review' THEN 'Your supply request "' || NEW.title || '" is now under review.'
          WHEN 'approved' THEN 'Your supply request "' || NEW.title || '" has been approved and will be fulfilled soon.'
          WHEN 'rejected' THEN 'Your supply request "' || NEW.title || '" has been rejected. ' || COALESCE('Reason: ' || NEW.approval_notes, '')
          WHEN 'cancelled' THEN 'Your supply request "' || NEW.title || '" has been cancelled.'
          ELSE 'Your supply request "' || NEW.title || '" status has been updated to ' || NEW.status
        END,
        CASE NEW.status
          WHEN 'approved' THEN 'medium'
          WHEN 'rejected' THEN 'high'
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

    -- Update approval timestamps
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
      NEW.approved_at = now();
      NEW.approved_by = auth.uid();
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Recreate the trigger with the updated function
CREATE TRIGGER handle_supply_request_status_change_trigger
  BEFORE UPDATE ON supply_requests
  FOR EACH ROW
  EXECUTE FUNCTION handle_supply_request_status_change();

-- Update the complete_supply_request_work function to handle cases with no inventory items
CREATE OR REPLACE FUNCTION complete_supply_request_work(p_request_id uuid, p_notes text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  request_record RECORD;
  item_record RECORD;
  insufficient_inventory BOOLEAN := FALSE;
  inventory_errors TEXT := '';
  work_duration INTEGER;
  item_count INTEGER := 0;
BEGIN
  -- Get the supply request details
  SELECT * INTO request_record
  FROM supply_requests
  WHERE id = p_request_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Supply request not found';
  END IF;

  IF request_record.work_started_at IS NULL THEN
    RAISE EXCEPTION 'Work must be started before it can be completed';
  END IF;

  IF request_record.work_completed_at IS NOT NULL THEN
    RAISE EXCEPTION 'Work has already been completed on this request';
  END IF;

  -- Calculate work duration in minutes
  work_duration := EXTRACT(EPOCH FROM (now() - request_record.work_started_at)) / 60;

  -- Count items to process
  SELECT COUNT(*) INTO item_count
  FROM supply_request_items
  WHERE request_id = p_request_id;

  -- Only process inventory if there are items
  IF item_count > 0 THEN
    -- Check inventory availability for all items first
    FOR item_record IN
      SELECT sri.*, ii.name as item_name, ii.quantity as available_quantity
      FROM supply_request_items sri
      JOIN inventory_items ii ON sri.item_id = ii.id
      WHERE sri.request_id = p_request_id
    LOOP
      IF COALESCE(item_record.quantity_approved, item_record.quantity_requested) > item_record.available_quantity THEN
        insufficient_inventory := TRUE;
        inventory_errors := inventory_errors || 
          format('Item "%s": Need %s, Available %s. ', 
            item_record.item_name,
            COALESCE(item_record.quantity_approved, item_record.quantity_requested),
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
        -- Use approved quantity if available, otherwise requested
        quantity_to_fulfill := COALESCE(item_record.quantity_approved, item_record.quantity_requested);

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
  END IF;

  -- Update the supply request as completed
  UPDATE supply_requests
  SET 
    status = 'fulfilled',
    fulfillment_stage = 'completed',
    work_completed_at = now(),
    work_duration_minutes = work_duration,
    fulfilled_by = auth.uid(),
    fulfilled_at = now(),
    fulfillment_notes = p_notes,
    updated_at = now()
  WHERE id = p_request_id;

  -- Log the work completion
  INSERT INTO supply_request_fulfillment_log (
    request_id,
    stage,
    performed_by,
    notes
  ) VALUES (
    p_request_id,
    'completed',
    auth.uid(),
    COALESCE(p_notes, 'Work completed and request fulfilled')
  );

  -- Create user notification
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
    request_record.requester_id,
    'supply_request_update',
    'Supply Request Completed',
    'Your supply request "' || request_record.title || '" has been completed and fulfilled. Work duration: ' || work_duration || ' minutes.',
    'low',
    '/my-requests',
    p_request_id,
    jsonb_build_object(
      'request_id', p_request_id,
      'stage', 'completed',
      'work_duration_minutes', work_duration
    )
  );
END;
$$;