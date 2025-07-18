-- Add fulfillment workflow columns to supply requests (excluding delivery_location which exists)
ALTER TABLE supply_requests 
ADD COLUMN fulfillment_stage TEXT DEFAULT 'pending',
ADD COLUMN assigned_fulfiller_id UUID REFERENCES profiles(id),
ADD COLUMN picking_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN picking_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN packing_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN packing_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN ready_for_delivery_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN delivery_method TEXT DEFAULT 'pickup',
ADD COLUMN delivery_notes TEXT,
ADD COLUMN recipient_confirmation TEXT,
ADD COLUMN fulfillment_cost DECIMAL(10,2);

-- Create fulfillment workflow tracking table
CREATE TABLE supply_request_fulfillment_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES supply_requests(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  performed_by UUID REFERENCES profiles(id),
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies for fulfillment log
ALTER TABLE supply_request_fulfillment_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Supply staff can manage fulfillment logs" ON supply_request_fulfillment_log
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND department IN ('Supply', 'Administration')
  )
);

CREATE POLICY "Requesters can view their fulfillment logs" ON supply_request_fulfillment_log
FOR SELECT USING (
  request_id IN (
    SELECT id FROM supply_requests 
    WHERE requester_id = auth.uid()
  )
);

-- Create enhanced fulfillment function with workflow stages
CREATE OR REPLACE FUNCTION public.advance_fulfillment_stage(
  p_request_id UUID,
  p_stage TEXT,
  p_notes TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  request_record RECORD;
  current_stage TEXT;
BEGIN
  -- Get current request details
  SELECT * INTO request_record
  FROM supply_requests
  WHERE id = p_request_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Supply request not found';
  END IF;

  current_stage := request_record.fulfillment_stage;

  -- Validate stage progression
  CASE p_stage
    WHEN 'assigned' THEN
      IF current_stage NOT IN ('pending', 'assigned') THEN
        RAISE EXCEPTION 'Cannot assign request in current stage: %', current_stage;
      END IF;
    WHEN 'picking' THEN
      IF current_stage NOT IN ('assigned', 'picking') THEN
        RAISE EXCEPTION 'Cannot start picking in current stage: %', current_stage;
      END IF;
    WHEN 'picked' THEN
      IF current_stage != 'picking' THEN
        RAISE EXCEPTION 'Cannot complete picking in current stage: %', current_stage;
      END IF;
    WHEN 'packing' THEN
      IF current_stage NOT IN ('picked', 'packing') THEN
        RAISE EXCEPTION 'Cannot start packing in current stage: %', current_stage;
      END IF;
    WHEN 'packed' THEN
      IF current_stage != 'packing' THEN
        RAISE EXCEPTION 'Cannot complete packing in current stage: %', current_stage;
      END IF;
    WHEN 'ready_for_delivery' THEN
      IF current_stage NOT IN ('packed', 'ready_for_delivery') THEN
        RAISE EXCEPTION 'Cannot mark ready for delivery in current stage: %', current_stage;
      END IF;
    WHEN 'completed' THEN
      IF current_stage != 'ready_for_delivery' THEN
        RAISE EXCEPTION 'Cannot complete delivery in current stage: %', current_stage;
      END IF;
  END CASE;

  -- Update stage and corresponding timestamp
  CASE p_stage
    WHEN 'assigned' THEN
      UPDATE supply_requests 
      SET fulfillment_stage = p_stage, assigned_fulfiller_id = auth.uid()
      WHERE id = p_request_id;
    WHEN 'picking' THEN
      UPDATE supply_requests 
      SET fulfillment_stage = p_stage, picking_started_at = now()
      WHERE id = p_request_id;
    WHEN 'picked' THEN
      UPDATE supply_requests 
      SET fulfillment_stage = p_stage, picking_completed_at = now()
      WHERE id = p_request_id;
    WHEN 'packing' THEN
      UPDATE supply_requests 
      SET fulfillment_stage = p_stage, packing_started_at = now()
      WHERE id = p_request_id;
    WHEN 'packed' THEN
      UPDATE supply_requests 
      SET fulfillment_stage = p_stage, packing_completed_at = now()
      WHERE id = p_request_id;
    WHEN 'ready_for_delivery' THEN
      UPDATE supply_requests 
      SET fulfillment_stage = p_stage, ready_for_delivery_at = now()
      WHERE id = p_request_id;
    WHEN 'completed' THEN
      -- This is where we actually fulfill the request and deduct inventory
      PERFORM fulfill_supply_request(p_request_id, p_notes);
      UPDATE supply_requests 
      SET fulfillment_stage = p_stage
      WHERE id = p_request_id;
  END CASE;

  -- Log the stage change
  INSERT INTO supply_request_fulfillment_log (
    request_id,
    stage,
    performed_by,
    notes,
    metadata
  ) VALUES (
    p_request_id,
    p_stage,
    auth.uid(),
    p_notes,
    p_metadata
  );

  -- Create user notification for stage updates
  IF p_stage IN ('assigned', 'picking', 'ready_for_delivery', 'completed') THEN
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
      CASE p_stage
        WHEN 'assigned' THEN 'Supply Request Assigned'
        WHEN 'picking' THEN 'Supply Request Being Prepared'
        WHEN 'ready_for_delivery' THEN 'Supply Request Ready for Pickup'
        WHEN 'completed' THEN 'Supply Request Completed'
      END,
      CASE p_stage
        WHEN 'assigned' THEN 'Your supply request "' || request_record.title || '" has been assigned to our fulfillment team.'
        WHEN 'picking' THEN 'Your supply request "' || request_record.title || '" is now being prepared.'
        WHEN 'ready_for_delivery' THEN 'Your supply request "' || request_record.title || '" is ready for pickup at ' || COALESCE(request_record.delivery_location, 'the supply office') || '.'
        WHEN 'completed' THEN 'Your supply request "' || request_record.title || '" has been completed and delivered.'
      END,
      CASE p_stage
        WHEN 'ready_for_delivery' THEN 'high'
        ELSE 'medium'
      END,
      '/my-requests',
      p_request_id,
      jsonb_build_object(
        'request_id', p_request_id,
        'stage', p_stage,
        'fulfillment_stage', p_stage
      )
    );
  END IF;
END;
$$;