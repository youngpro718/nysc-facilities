-- Create key_orders table for tracking key fulfillment
CREATE TABLE key_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES key_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL CHECK (request_type IN ('spare', 'replacement', 'new')),
  room_id UUID REFERENCES rooms(id),
  room_other TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending_fulfillment' CHECK (status IN ('pending_fulfillment', 'in_progress', 'ready_for_pickup', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE,
  fulfilled_by UUID REFERENCES auth.users(id),
  fulfillment_notes TEXT
);

-- Enable RLS
ALTER TABLE key_orders ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own key orders" 
ON key_orders 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all key orders" 
ON key_orders 
FOR ALL 
USING (auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin'));

-- Create indexes
CREATE INDEX idx_key_orders_user_id ON key_orders(user_id);
CREATE INDEX idx_key_orders_request_id ON key_orders(request_id);
CREATE INDEX idx_key_orders_status ON key_orders(status);
CREATE INDEX idx_key_orders_created_at ON key_orders(created_at DESC);

-- Create trigger for updating updated_at
CREATE TRIGGER update_key_orders_timestamp
  BEFORE UPDATE ON key_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

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
$$;