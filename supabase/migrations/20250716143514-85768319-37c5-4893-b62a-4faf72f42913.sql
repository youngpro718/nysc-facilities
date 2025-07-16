-- Create supply_requests table
CREATE TABLE public.supply_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  justification TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'fulfilled', 'cancelled')),
  requested_delivery_date TIMESTAMP WITH TIME ZONE,
  delivery_location TEXT,
  approved_by UUID REFERENCES auth.users(id),
  fulfilled_by UUID REFERENCES auth.users(id),
  approval_notes TEXT,
  fulfillment_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved_at TIMESTAMP WITH TIME ZONE,
  fulfilled_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create supply_request_items table for multi-item requests
CREATE TABLE public.supply_request_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES supply_requests(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  quantity_requested INTEGER NOT NULL CHECK (quantity_requested > 0),
  quantity_approved INTEGER,
  quantity_fulfilled INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.supply_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supply_request_items ENABLE ROW LEVEL SECURITY;

-- Create policies for supply_requests
CREATE POLICY "Users can view their own supply requests" 
ON public.supply_requests 
FOR SELECT 
USING (auth.uid() = requester_id);

CREATE POLICY "Users can create supply requests" 
ON public.supply_requests 
FOR INSERT 
WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update their own pending requests" 
ON public.supply_requests 
FOR UPDATE 
USING (auth.uid() = requester_id AND status = 'pending');

-- Supply department users can view and manage all requests
CREATE POLICY "Supply department can view all requests" 
ON public.supply_requests 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND (p.department = 'Supply' OR p.department = 'Administration')
  )
);

CREATE POLICY "Supply department can update requests" 
ON public.supply_requests 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND (p.department = 'Supply' OR p.department = 'Administration')
  )
);

-- Create policies for supply_request_items
CREATE POLICY "Users can view items for their requests" 
ON public.supply_request_items 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM supply_requests sr 
    WHERE sr.id = request_id AND sr.requester_id = auth.uid()
  )
);

CREATE POLICY "Users can insert items for their requests" 
ON public.supply_request_items 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM supply_requests sr 
    WHERE sr.id = request_id AND sr.requester_id = auth.uid()
  )
);

CREATE POLICY "Supply department can view all request items" 
ON public.supply_request_items 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND (p.department = 'Supply' OR p.department = 'Administration')
  )
);

CREATE POLICY "Supply department can update request items" 
ON public.supply_request_items 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND (p.department = 'Supply' OR p.department = 'Administration')
  )
);

-- Create indexes for better performance
CREATE INDEX idx_supply_requests_requester_id ON supply_requests(requester_id);
CREATE INDEX idx_supply_requests_status ON supply_requests(status);
CREATE INDEX idx_supply_requests_created_at ON supply_requests(created_at DESC);
CREATE INDEX idx_supply_request_items_request_id ON supply_request_items(request_id);
CREATE INDEX idx_supply_request_items_item_id ON supply_request_items(item_id);

-- Create function to update supply request timestamps
CREATE OR REPLACE FUNCTION public.update_supply_request_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for supply_requests
CREATE TRIGGER update_supply_requests_updated_at
  BEFORE UPDATE ON supply_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_supply_request_timestamp();

-- Create trigger for supply_request_items
CREATE TRIGGER update_supply_request_items_updated_at
  BEFORE UPDATE ON supply_request_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Create function to handle supply request status changes and notifications
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for supply request status changes
CREATE TRIGGER handle_supply_request_status_change_trigger
  BEFORE UPDATE ON supply_requests
  FOR EACH ROW
  EXECUTE FUNCTION handle_supply_request_status_change();

-- Create function to validate inventory availability
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
$$ LANGUAGE plpgsql;

-- Create trigger for inventory validation
CREATE TRIGGER validate_supply_request_inventory_trigger
  BEFORE INSERT ON supply_request_items
  FOR EACH ROW
  EXECUTE FUNCTION validate_supply_request_inventory();