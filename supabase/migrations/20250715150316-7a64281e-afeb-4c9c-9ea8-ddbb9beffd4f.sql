-- Fix security warning: Set explicit search_path for functions to prevent search path manipulation attacks

-- Update create_shutdown_notifications function to set search_path
CREATE OR REPLACE FUNCTION public.create_shutdown_notifications()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
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
$function$;

-- Update update_shutdown_updated_at function to set search_path
CREATE OR REPLACE FUNCTION public.update_shutdown_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Update update_updated_at_column function to set search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$function$;