-- Fix the notify_maintenance_affected_users function by removing the problematic ora.end_date reference
CREATE OR REPLACE FUNCTION public.notify_maintenance_affected_users()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
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