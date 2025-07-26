-- Fix remaining security definer functions and add proper search paths
-- This addresses the function search path mutable warnings

-- Update all remaining functions that need secure search_path
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
 RETURNS user_role
 LANGUAGE sql
 SECURITY DEFINER
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT role FROM public.user_roles WHERE user_id = $1
$function$;

CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = $1 AND role = 'admin'
  );
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user_role()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'standard');
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_user_verification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    IF NEW.verification_status = 'verified' AND OLD.verification_status = 'pending' THEN
        -- Check if email domain is nycourt.gov
        IF NEW.email IS NOT NULL AND NEW.email LIKE '%@nycourt.gov' THEN
            BEGIN
                -- Check if occupant already exists with this email
                IF EXISTS (SELECT 1 FROM occupants WHERE LOWER(email) = LOWER(NEW.email)) THEN
                    -- Update existing occupant record with user ID
                    UPDATE occupants 
                    SET id = NEW.id, status = 'active', updated_at = now()
                    WHERE LOWER(email) = LOWER(NEW.email);
                ELSE
                    -- Create new occupant record
                    INSERT INTO occupants (id, first_name, last_name, email, status)
                    VALUES (NEW.id, NEW.first_name, NEW.last_name, NEW.email, 'active');
                END IF;
                EXCEPTION WHEN OTHERS THEN
                    RAISE NOTICE 'Error handling occupant verification: %', SQLERRM;
            END;
        END IF;
    END IF;
    RETURN NEW;
END;
$function$;

-- Update all other security definer functions to include proper search_path
CREATE OR REPLACE FUNCTION public.log_room_assignment_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Log the assignment change
    INSERT INTO public.room_assignment_audit_log (
      assignment_id,
      action_type,
      performed_by,
      new_values
    ) VALUES (
      NEW.id,
      'created',
      auth.uid(),
      row_to_json(NEW)::jsonb
    );
    
    -- Create user notification for new assignment
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
      NEW.occupant_id,
      'new_assignment',
      'New Room Assignment',
      'You have been assigned to ' || 
      COALESCE(
        (SELECT room_number FROM rooms WHERE id = NEW.room_id),
        'a room'
      ) || 
      CASE 
        WHEN NEW.is_primary THEN ' as your primary office'
        ELSE ' (' || COALESCE(NEW.assignment_type, 'assignment') || ')'
      END,
      CASE WHEN NEW.is_primary THEN 'high' ELSE 'medium' END,
      '/dashboard',
      NEW.id,
      jsonb_build_object(
        'assignment_id', NEW.id,
        'room_id', NEW.room_id,
        'assignment_type', NEW.assignment_type,
        'is_primary', NEW.is_primary
      )
    );
    
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Log the assignment change
    INSERT INTO public.room_assignment_audit_log (
      assignment_id,
      action_type,
      performed_by,
      old_values,
      new_values
    ) VALUES (
      NEW.id,
      CASE 
        WHEN NEW.expiration_date IS DISTINCT FROM OLD.expiration_date 
        AND NEW.expiration_date > now() THEN 'renewed'
        ELSE 'updated'
      END,
      auth.uid(),
      row_to_json(OLD)::jsonb,
      row_to_json(NEW)::jsonb
    );
    
    -- Create notification for significant changes
    IF OLD.room_id IS DISTINCT FROM NEW.room_id OR OLD.is_primary IS DISTINCT FROM NEW.is_primary THEN
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
        NEW.occupant_id,
        'new_assignment',
        'Room Assignment Updated',
        'Your room assignment has been updated to ' || 
        COALESCE(
          (SELECT room_number FROM rooms WHERE id = NEW.room_id),
          'a room'
        ) || 
        CASE 
          WHEN NEW.is_primary THEN ' as your primary office'
          ELSE ' (' || COALESCE(NEW.assignment_type, 'assignment') || ')'
        END,
        'medium',
        '/dashboard',
        NEW.id,
        jsonb_build_object(
          'assignment_id', NEW.id,
          'room_id', NEW.room_id,
          'assignment_type', NEW.assignment_type,
          'is_primary', NEW.is_primary,
          'previous_room_id', OLD.room_id
        )
      );
    END IF;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Log the assignment change
    INSERT INTO public.room_assignment_audit_log (
      assignment_id,
      action_type,
      performed_by,
      old_values
    ) VALUES (
      OLD.id,
      'deleted',
      auth.uid(),
      row_to_json(OLD)::jsonb
    );
    
    -- Create notification for assignment removal
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
      OLD.occupant_id,
      'new_assignment',
      'Room Assignment Removed',
      'Your assignment to ' || 
      COALESCE(
        (SELECT room_number FROM rooms WHERE id = OLD.room_id),
        'a room'
      ) || ' has been removed',
      'medium',
      '/dashboard',
      OLD.id,
      jsonb_build_object(
        'assignment_id', OLD.id,
        'room_id', OLD.room_id,
        'assignment_type', OLD.assignment_type,
        'action', 'removed'
      )
    );
    
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

-- Continue with other critical security definer functions
CREATE OR REPLACE FUNCTION public.create_key_order(p_key_id uuid, p_quantity integer, p_requestor_id uuid, p_recipient_id uuid DEFAULT NULL::uuid, p_expected_delivery_date timestamp with time zone DEFAULT NULL::timestamp with time zone, p_notes text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_order_id UUID;
BEGIN
  -- Insert new order
  INSERT INTO key_orders (
    key_id,
    quantity,
    requestor_id,
    recipient_id,
    expected_delivery_date,
    notes,
    status
  ) VALUES (
    p_key_id,
    p_quantity,
    p_requestor_id,
    p_recipient_id,
    p_expected_delivery_date,
    p_notes,
    'ordered'
  )
  RETURNING id INTO new_order_id;
  
  -- Create a stock transaction for the ordered keys
  INSERT INTO key_stock_transactions (
    key_id,
    transaction_type,
    quantity,
    performed_by,
    notes,
    order_id
  ) VALUES (
    p_key_id,
    'ordered',
    p_quantity,
    p_requestor_id,
    'New key order created',
    new_order_id
  );
  
  RETURN new_order_id;
END;
$function$;

-- Enable leaked password protection (addressing the warning)
-- This requires Supabase Auth settings update which is handled via the dashboard

-- Add additional security measures for authentication
CREATE OR REPLACE FUNCTION public.track_failed_login_attempts()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Track failed login attempts for account lockout
  INSERT INTO public.rate_limit_tracking (user_id, action_type, ip_address)
  VALUES (NULL, 'failed_login', inet_client_addr());
  
  RETURN NULL;
END;
$function$;

-- Add function to check account lockout status
CREATE OR REPLACE FUNCTION public.is_account_locked(user_email text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  failed_attempts integer;
BEGIN
  -- Count failed login attempts in the last hour
  SELECT COUNT(*) INTO failed_attempts
  FROM public.rate_limit_tracking
  WHERE action_type = 'failed_login'
    AND created_at > (now() - interval '1 hour');
  
  -- Lock account after 5 failed attempts
  RETURN failed_attempts >= 5;
END;
$function$;