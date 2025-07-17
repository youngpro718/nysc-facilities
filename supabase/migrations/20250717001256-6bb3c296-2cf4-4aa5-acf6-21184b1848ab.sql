-- Fix key request approval issue by making key_id nullable in key_orders
-- and updating the trigger function to handle NULL key_id

-- 1. Make key_id nullable in key_orders table
ALTER TABLE key_orders ALTER COLUMN key_id DROP NOT NULL;

-- 2. Update the auto_create_key_order trigger function to handle NULL key_id
CREATE OR REPLACE FUNCTION public.auto_create_key_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
    -- When a request is approved, create corresponding order
    IF TG_OP = 'UPDATE' AND OLD.status != 'approved' AND NEW.status = 'approved' THEN
        INSERT INTO key_orders (
            request_id,
            user_id,
            key_id,  -- This can be NULL for now
            quantity,
            status,
            priority,
            notes,
            ordered_by,
            ordered_at
        ) VALUES (
            NEW.id,
            NEW.user_id,
            NEW.key_id,  -- Will be NULL for new key requests
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
$function$;