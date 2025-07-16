-- Phase 1: Database Schema Fixes for Key Management System (Corrected)

-- First, add missing columns to key_orders table
ALTER TABLE key_orders 
ADD COLUMN IF NOT EXISTS request_id UUID REFERENCES key_requests(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
ADD COLUMN IF NOT EXISTS estimated_delivery_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS tracking_number TEXT,
ADD COLUMN IF NOT EXISTS vendor_order_id TEXT,
ADD COLUMN IF NOT EXISTS cost DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS delivery_notes TEXT;

-- Create proper status enum for key requests if not exists
DO $$ BEGIN
    CREATE TYPE key_request_status AS ENUM (
        'pending',
        'under_review', 
        'approved',
        'rejected',
        'cancelled',
        'fulfilled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create proper status enum for key orders if not exists  
DO $$ BEGIN
    CREATE TYPE key_order_status AS ENUM (
        'pending_fulfillment',
        'ordered',
        'in_transit',
        'received',
        'ready_for_pickup',
        'delivered',
        'completed',
        'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Handle status column conversion for key_requests
-- First check if we need to convert the column type
DO $$ 
BEGIN
    -- Add a temporary column with the new enum type
    ALTER TABLE key_requests ADD COLUMN IF NOT EXISTS status_new key_request_status;
    
    -- Update the new column based on existing values
    UPDATE key_requests SET status_new = 
        CASE 
            WHEN status = 'approved' THEN 'approved'::key_request_status
            WHEN status = 'rejected' THEN 'rejected'::key_request_status
            WHEN status = 'pending' THEN 'pending'::key_request_status
            WHEN status = 'under_review' THEN 'under_review'::key_request_status
            WHEN status = 'cancelled' THEN 'cancelled'::key_request_status
            WHEN status = 'fulfilled' THEN 'fulfilled'::key_request_status
            ELSE 'pending'::key_request_status  -- Default for any unknown values
        END;
    
    -- Drop the old column and rename the new one
    ALTER TABLE key_requests DROP COLUMN status;
    ALTER TABLE key_requests RENAME COLUMN status_new TO status;
    
    -- Set default and not null constraint
    ALTER TABLE key_requests ALTER COLUMN status SET DEFAULT 'pending'::key_request_status;
    ALTER TABLE key_requests ALTER COLUMN status SET NOT NULL;
END $$;

-- Handle status column conversion for key_orders
DO $$ 
BEGIN
    -- Add a temporary column with the new enum type
    ALTER TABLE key_orders ADD COLUMN IF NOT EXISTS status_new key_order_status;
    
    -- Update the new column based on existing values
    UPDATE key_orders SET status_new = 
        CASE 
            WHEN status = 'pending_fulfillment' THEN 'pending_fulfillment'::key_order_status
            WHEN status = 'ordered' THEN 'ordered'::key_order_status
            WHEN status = 'in_transit' THEN 'in_transit'::key_order_status
            WHEN status = 'received' THEN 'received'::key_order_status
            WHEN status = 'ready_for_pickup' THEN 'ready_for_pickup'::key_order_status
            WHEN status = 'delivered' THEN 'delivered'::key_order_status
            WHEN status = 'completed' THEN 'completed'::key_order_status
            WHEN status = 'cancelled' THEN 'cancelled'::key_order_status
            ELSE 'pending_fulfillment'::key_order_status  -- Default for any unknown values
        END;
    
    -- Drop the old column and rename the new one
    ALTER TABLE key_orders DROP COLUMN status;
    ALTER TABLE key_orders RENAME COLUMN status_new TO status;
    
    -- Set default and not null constraint
    ALTER TABLE key_orders ALTER COLUMN status SET DEFAULT 'pending_fulfillment'::key_order_status;
    ALTER TABLE key_orders ALTER COLUMN status SET NOT NULL;
END $$;

-- Add workflow tracking fields to key_requests
ALTER TABLE key_requests 
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rejected_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS fulfillment_notes TEXT,
ADD COLUMN IF NOT EXISTS last_status_change TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Add workflow tracking fields to key_orders
ALTER TABLE key_orders 
ADD COLUMN IF NOT EXISTS ordered_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS ordered_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS received_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS received_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS delivered_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_status_change TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Create admin notifications table for key management
CREATE TABLE IF NOT EXISTS admin_notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    notification_type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    urgency TEXT NOT NULL DEFAULT 'medium' CHECK (urgency IN ('low', 'medium', 'high', 'critical')),
    related_table TEXT,
    related_id UUID,
    metadata JSONB DEFAULT '{}',
    read_by UUID[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on admin notifications
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- Create policy for admin notifications - only admins can see
CREATE POLICY "Admins can manage notifications" ON admin_notifications
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- Create key request workflow tracking table
CREATE TABLE IF NOT EXISTS key_request_workflow (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    request_id UUID NOT NULL REFERENCES key_requests(id) ON DELETE CASCADE,
    from_status TEXT,
    to_status TEXT NOT NULL,
    changed_by UUID REFERENCES auth.users(id),
    change_reason TEXT,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on workflow tracking
ALTER TABLE key_request_workflow ENABLE ROW LEVEL SECURITY;

-- Create policy for workflow tracking
CREATE POLICY "Users can view their request workflow" ON key_request_workflow
FOR SELECT USING (
    request_id IN (
        SELECT id FROM key_requests WHERE user_id = auth.uid()
    ) OR 
    EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

CREATE POLICY "Admins can manage workflow" ON key_request_workflow
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_key_requests_user_status ON key_requests(user_id, status);
CREATE INDEX IF NOT EXISTS idx_key_requests_status_created ON key_requests(status, created_at);
CREATE INDEX IF NOT EXISTS idx_key_orders_request_id ON key_orders(request_id);
CREATE INDEX IF NOT EXISTS idx_key_orders_user_status ON key_orders(user_id, status);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_type_created ON admin_notifications(notification_type, created_at);
CREATE INDEX IF NOT EXISTS idx_key_request_workflow_request_id ON key_request_workflow(request_id, created_at);