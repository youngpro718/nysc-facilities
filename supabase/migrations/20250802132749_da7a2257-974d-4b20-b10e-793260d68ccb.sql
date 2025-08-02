-- Complete security fixes without enum issues

-- Fix all functions that are missing search_path
-- Update all existing functions to include proper search_path

-- Fix update_updated_at function
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- Fix handle_new_user_role function
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'standard');
  RETURN NEW;
END;
$$;

-- Fix update_door_maintenance_schedule function
CREATE OR REPLACE FUNCTION public.update_door_maintenance_schedule()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- Schedule more frequent checks for high-security doors
  IF NEW.security_level = 'high_security' THEN
    NEW.next_maintenance_date := CURRENT_DATE + INTERVAL '1 month';
  ELSE
    NEW.next_maintenance_date := CURRENT_DATE + INTERVAL '3 months';
  END IF;
  RETURN NEW;
END;
$$;

-- Fix rollback_transaction function
CREATE OR REPLACE FUNCTION public.rollback_transaction()
RETURNS void
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
    -- This is just a placeholder function that does nothing
    -- The actual transaction control is handled by the client
    NULL;
END;
$$;

-- Fix get_room_size_category function
CREATE OR REPLACE FUNCTION public.get_room_size_category(room_width integer, room_height integer)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF room_width IS NULL OR room_height IS NULL THEN
    RETURN 'medium';
  END IF;
  
  -- Calculate area and categorize
  DECLARE area integer := room_width * room_height;
  BEGIN
    IF area < 2000 THEN
      RETURN 'small';
    ELSIF area > 5000 THEN
      RETURN 'large';
    ELSE
      RETURN 'medium';
    END IF;
  END;
END;
$$;

-- Fix create_shutdown_notifications function
CREATE OR REPLACE FUNCTION public.create_shutdown_notifications()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- One week notification
  INSERT INTO shutdown_notifications (shutdown_id, notification_type, scheduled_for, message)
  VALUES (
    NEW.id,
    'one_week',
    NEW.start_date - INTERVAL '7 days',
    'Shutdown scheduled in one week: ' || NEW.title
  );
  
  -- Three days notification
  INSERT INTO shutdown_notifications (shutdown_id, notification_type, scheduled_for, message)
  VALUES (
    NEW.id,
    'three_days',
    NEW.start_date - INTERVAL '3 days',
    'Shutdown scheduled in three days: ' || NEW.title
  );
  
  -- One day notification
  INSERT INTO shutdown_notifications (shutdown_id, notification_type, scheduled_for, message)
  VALUES (
    NEW.id,
    'one_day',
    NEW.start_date - INTERVAL '1 day',
    'Shutdown scheduled tomorrow: ' || NEW.title
  );
  
  -- Start notification
  INSERT INTO shutdown_notifications (shutdown_id, notification_type, scheduled_for, message)
  VALUES (
    NEW.id,
    'start',
    NEW.start_date::timestamp with time zone,
    'Shutdown starting today: ' || NEW.title
  );
  
  RETURN NEW;
END;
$$;