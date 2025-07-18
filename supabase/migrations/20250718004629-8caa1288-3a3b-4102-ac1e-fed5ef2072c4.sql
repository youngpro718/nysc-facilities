-- Simplify fulfillment workflow to just start/complete tracking
-- Add work tracking columns
ALTER TABLE supply_requests 
ADD COLUMN IF NOT EXISTS work_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS work_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS work_duration_minutes INTEGER;

-- Update existing fulfillment_stage values to simpler ones
UPDATE supply_requests 
SET fulfillment_stage = CASE 
  WHEN fulfillment_stage IN ('assigned', 'picking', 'picked', 'packing', 'packed', 'ready_for_delivery') THEN 'in_progress'
  WHEN fulfillment_stage = 'completed' THEN 'completed'
  ELSE 'pending'
END;

-- Create simplified function to start work on a supply request
CREATE OR REPLACE FUNCTION start_supply_request_work(p_request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  request_record RECORD;
BEGIN
  -- Get the supply request details
  SELECT * INTO request_record
  FROM supply_requests
  WHERE id = p_request_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Supply request not found';
  END IF;

  IF request_record.status != 'approved' THEN
    RAISE EXCEPTION 'Supply request must be approved before starting work';
  END IF;

  IF request_record.work_started_at IS NOT NULL THEN
    RAISE EXCEPTION 'Work has already been started on this request';
  END IF;

  -- Update the request to mark work as started
  UPDATE supply_requests
  SET 
    fulfillment_stage = 'in_progress',
    work_started_at = now(),
    assigned_fulfiller_id = auth.uid(),
    updated_at = now()
  WHERE id = p_request_id;

  -- Log the work start
  INSERT INTO supply_request_fulfillment_log (
    request_id,
    stage,
    performed_by,
    notes
  ) VALUES (
    p_request_id,
    'in_progress',
    auth.uid(),
    'Work started on supply request'
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
    'Work Started on Your Request',
    'Work has begun on your supply request "' || request_record.title || '".',
    'medium',
    '/my-requests',
    p_request_id,
    jsonb_build_object(
      'request_id', p_request_id,
      'stage', 'in_progress'
    )
  );
END;
$$;

-- Create simplified function to complete work and fulfill the request
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