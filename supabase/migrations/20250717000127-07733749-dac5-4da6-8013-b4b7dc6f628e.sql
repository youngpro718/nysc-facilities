-- Phase 1 continued: Add automation triggers and functions for key management

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

-- Create function to track key order status changes
CREATE OR REPLACE FUNCTION track_key_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Track status changes and update timestamps
    IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
        NEW.last_status_change = CURRENT_TIMESTAMP;
        
        -- Set specific timestamp fields based on status
        CASE NEW.status
            WHEN 'ordered' THEN 
                NEW.ordered_by = COALESCE(NEW.ordered_by, auth.uid());
                NEW.ordered_at = COALESCE(NEW.ordered_at, CURRENT_TIMESTAMP);
            WHEN 'received' THEN 
                NEW.received_by = COALESCE(NEW.received_by, auth.uid());
                NEW.received_at = COALESCE(NEW.received_at, CURRENT_TIMESTAMP);
            WHEN 'delivered', 'completed' THEN 
                NEW.delivered_by = COALESCE(NEW.delivered_by, auth.uid());
                NEW.delivered_at = COALESCE(NEW.delivered_at, CURRENT_TIMESTAMP);
            ELSE NULL;
        END CASE;
        
        -- Create user notification for significant status changes
        IF NEW.status IN ('ready_for_pickup', 'delivered', 'completed') THEN
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
                NEW.user_id,
                'key_order_update',
                CASE 
                    WHEN NEW.status = 'ready_for_pickup' THEN 'Key Ready for Pickup'
                    WHEN NEW.status = 'delivered' THEN 'Key Delivered'
                    WHEN NEW.status = 'completed' THEN 'Key Order Completed'
                END,
                CASE 
                    WHEN NEW.status = 'ready_for_pickup' THEN 'Your key order is ready for pickup at the facilities office.'
                    WHEN NEW.status = 'delivered' THEN 'Your key order has been delivered.'
                    WHEN NEW.status = 'completed' THEN 'Your key order has been completed successfully.'
                END,
                CASE 
                    WHEN NEW.status = 'ready_for_pickup' THEN 'high'
                    ELSE 'medium'
                END,
                '/my-requests',
                NEW.id,
                jsonb_build_object(
                    'order_id', NEW.id,
                    'request_id', NEW.request_id,
                    'status', NEW.status
                )
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for order status change tracking
DROP TRIGGER IF EXISTS trigger_track_key_order_status ON key_orders;
CREATE TRIGGER trigger_track_key_order_status
    BEFORE UPDATE ON key_orders
    FOR EACH ROW
    EXECUTE FUNCTION track_key_order_status_change();