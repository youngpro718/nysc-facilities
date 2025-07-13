-- Fix security warning: Set explicit search_path for functions to prevent search path manipulation attacks

-- Update notify_maintenance_affected_users function to set search_path
CREATE OR REPLACE FUNCTION public.notify_maintenance_affected_users()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- This will be implemented to find users assigned to the affected space
  -- and create notification records
  INSERT INTO maintenance_notifications (
    maintenance_schedule_id,
    user_id,
    notification_type,
    message
  )
  SELECT 
    NEW.id,
    ora.occupant_id,
    'scheduled',
    'Maintenance scheduled: ' || NEW.title || ' in ' || NEW.space_name || 
    ' from ' || to_char(NEW.scheduled_start_date, 'Mon DD, YYYY') ||
    CASE WHEN NEW.scheduled_end_date IS NOT NULL 
         THEN ' to ' || to_char(NEW.scheduled_end_date, 'Mon DD, YYYY')
         ELSE ''
    END
  FROM occupant_room_assignments ora
  JOIN rooms r ON r.id = ora.room_id
  WHERE NEW.space_type = 'room' 
    AND (NEW.space_id = ora.room_id OR NEW.space_name = r.room_number);
  
  RETURN NEW;
END;
$function$;

-- Update update_court_maintenance_status function to set search_path
CREATE OR REPLACE FUNCTION public.update_court_maintenance_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Update court rooms when maintenance affects them
  IF NEW.space_type = 'room' AND NEW.impact_level IN ('significant', 'full_closure') THEN
    UPDATE court_rooms 
    SET 
      maintenance_status = CASE 
        WHEN NEW.status = 'scheduled' THEN 'maintenance_scheduled'
        WHEN NEW.status = 'in_progress' THEN 'under_maintenance'
        WHEN NEW.status = 'completed' THEN 'operational'
        ELSE maintenance_status
      END,
      maintenance_start_date = CASE WHEN NEW.status = 'in_progress' THEN NEW.actual_start_date ELSE maintenance_start_date END,
      maintenance_end_date = CASE WHEN NEW.status = 'completed' THEN NEW.actual_end_date ELSE maintenance_end_date END,
      maintenance_notes = NEW.title || ': ' || COALESCE(NEW.description, '')
    WHERE room_number = NEW.space_name;
  END IF;
  
  RETURN NEW;
END;
$function$;