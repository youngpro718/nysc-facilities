-- Fix security warnings: Set search_path for functions to prevent SQL injection
-- This addresses the "Function Search Path Mutable" warnings

-- Fix get_room_size_category function
CREATE OR REPLACE FUNCTION public.get_room_size_category(room_width integer, room_height integer)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

-- Fix update_room_occupancy_timestamp function
CREATE OR REPLACE FUNCTION public.update_room_occupancy_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- Fix update_room_key_access_timestamp function
CREATE OR REPLACE FUNCTION public.update_room_key_access_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- Fix get_room_assignments_with_details function
CREATE OR REPLACE FUNCTION public.get_room_assignments_with_details(p_room_id UUID DEFAULT NULL)
RETURNS TABLE (
    assignment_id UUID,
    occupant_id UUID,
    room_id UUID,
    assignment_type TEXT,
    is_primary BOOLEAN,
    assigned_at TIMESTAMPTZ,
    occupant_name TEXT,
    room_number TEXT,
    floor_name TEXT,
    building_name TEXT
) 
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
    SELECT 
        ora.id as assignment_id,
        ora.occupant_id,
        ora.room_id,
        ora.assignment_type,
        ora.is_primary,
        ora.assigned_at,
        COALESCE(o.first_name || ' ' || o.last_name, 'Unknown') as occupant_name,
        r.room_number,
        f.name as floor_name,
        b.name as building_name
    FROM occupant_room_assignments ora
    LEFT JOIN occupants o ON o.id = ora.occupant_id
    LEFT JOIN rooms r ON r.id = ora.room_id
    LEFT JOIN floors f ON f.id = r.floor_id
    LEFT JOIN buildings b ON b.id = f.building_id
    WHERE (p_room_id IS NULL OR ora.room_id = p_room_id)
    AND ora.expiration_date IS NULL
    ORDER BY ora.is_primary DESC, ora.assigned_at DESC;
$function$;