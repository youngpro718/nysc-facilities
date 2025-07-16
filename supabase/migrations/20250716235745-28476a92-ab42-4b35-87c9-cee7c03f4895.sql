-- Phase 1: Database Schema Fixes for Key Management System

-- First, let's check if key_orders table exists and add missing columns
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

-- Update key_requests table to use proper enum
ALTER TABLE key_requests 
ALTER COLUMN status TYPE key_request_status USING status::key_request_status;

-- Update key_orders table to use proper enum
ALTER TABLE key_orders 
ALTER COLUMN status TYPE key_order_status USING status::key_order_status;

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

-- Create function to automatically create admin notifications for new key requests
CREATE OR REPLACE FUNCTION notify_admins_of_key_request()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create notification for new pending requests
    IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
        INSERT INTO admin_notifications (
            notification_type,
            title,
            message,
            urgency,
            related_table,
            related_id,
            metadata
        ) VALUES (
            'new_key_request',
            'New Key Request',
            'A new key request has been submitted for ' || 
            CASE 
                WHEN NEW.request_type = 'new' THEN 'new key access'
                WHEN NEW.request_type = 'spare' THEN 'spare key'
                WHEN NEW.request_type = 'replacement' THEN 'key replacement'
                ELSE 'key access'
            END ||
            CASE WHEN NEW.room_other IS NOT NULL THEN ' for ' || NEW.room_other ELSE '' END,
            CASE 
                WHEN NEW.emergency_contact IS NOT NULL THEN 'high'
                ELSE 'medium'
            END,
            'key_requests',
            NEW.id,
            jsonb_build_object(
                'request_type', NEW.request_type,
                'quantity', NEW.quantity,
                'room_id', NEW.room_id,
                'room_other', NEW.room_other,
                'user_id', NEW.user_id
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for admin notifications
DROP TRIGGER IF EXISTS trigger_notify_admins_key_request ON key_requests;
CREATE TRIGGER trigger_notify_admins_key_request
    AFTER INSERT ON key_requests
    FOR EACH ROW
    EXECUTE FUNCTION notify_admins_of_key_request();

-- Create function to track key request status changes
CREATE OR REPLACE FUNCTION track_key_request_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Track status changes
    IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO key_request_workflow (
            request_id,
            from_status,
            to_status,
            changed_by,
            change_reason,
            notes
        ) VALUES (
            NEW.id,
            OLD.status::TEXT,
            NEW.status::TEXT,
            auth.uid(),
            'Status change',
            CASE 
                WHEN NEW.status = 'approved' THEN 'Request approved by admin'
                WHEN NEW.status = 'rejected' THEN 'Request rejected: ' || COALESCE(NEW.rejection_reason, 'No reason provided')
                WHEN NEW.status = 'cancelled' THEN 'Request cancelled by user'
                WHEN NEW.status = 'fulfilled' THEN 'Request fulfilled'
                ELSE 'Status updated'
            END
        );
        
        -- Update timestamp
        NEW.last_status_change = CURRENT_TIMESTAMP;
        
        -- Set approval/rejection fields
        IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
            NEW.approved_by = auth.uid();
            NEW.approved_at = CURRENT_TIMESTAMP;
        ELSIF NEW.status = 'rejected' AND OLD.status != 'rejected' THEN
            NEW.rejected_by = auth.uid();
            NEW.rejected_at = CURRENT_TIMESTAMP;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for status change tracking
DROP TRIGGER IF EXISTS trigger_track_key_request_status ON key_requests;
CREATE TRIGGER trigger_track_key_request_status
    BEFORE UPDATE ON key_requests
    FOR EACH ROW
    EXECUTE FUNCTION track_key_request_status_change();

-- Create function to automatically create key orders when requests are approved
CREATE OR REPLACE FUNCTION auto_create_key_order()
RETURNS TRIGGER AS $$
BEGIN
    -- When a request is approved, create corresponding order
    IF TG_OP = 'UPDATE' AND OLD.status != 'approved' AND NEW.status = 'approved' THEN
        INSERT INTO key_orders (
            request_id,
            user_id,
            key_id,
            quantity,
            status,
            priority,
            notes,
            ordered_by,
            ordered_at
        ) VALUES (
            NEW.id,
            NEW.user_id,
            NEW.key_id,
            NEW.quantity,
            'pending_fulfillment',
            CASE 
                WHEN NEW.emergency_contact IS NOT NULL THEN 'urgent'
                ELSE 'medium'
            END,
            'Auto-created from approved request #' || NEW.id,
            auth.uid(),
            CURRENT_TIMESTAMP
        );
        
        -- Create admin notification for new order
        INSERT INTO admin_notifications (
            notification_type,
            title,
            message,
            urgency,
            related_table,
            related_id,
            metadata
        ) VALUES (
            'new_key_order',
            'New Key Order Ready',
            'Key request has been approved and order needs to be processed',
            'medium',
            'key_orders',
            (SELECT id FROM key_orders WHERE request_id = NEW.id ORDER BY created_at DESC LIMIT 1),
            jsonb_build_object(
                'request_id', NEW.id,
                'user_id', NEW.user_id,
                'quantity', NEW.quantity
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auto order creation
DROP TRIGGER IF EXISTS trigger_auto_create_key_order ON key_requests;
CREATE TRIGGER trigger_auto_create_key_order
    AFTER UPDATE ON key_requests
    FOR EACH ROW
    EXECUTE FUNCTION auto_create_key_order();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_key_requests_user_status ON key_requests(user_id, status);
CREATE INDEX IF NOT EXISTS idx_key_requests_status_created ON key_requests(status, created_at);
CREATE INDEX IF NOT EXISTS idx_key_orders_request_id ON key_orders(request_id);
CREATE INDEX IF NOT EXISTS idx_key_orders_user_status ON key_orders(user_id, status);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_type_created ON admin_notifications(notification_type, created_at);
CREATE INDEX IF NOT EXISTS idx_key_request_workflow_request_id ON key_request_workflow(request_id, created_at);