-- Fix room size categorization with proper handling of non-numeric room numbers

-- First, create a function that properly uses the JSONB size column  
CREATE OR REPLACE FUNCTION public.get_room_size_from_data(room_size_data jsonb)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    width_val integer;
    height_val integer;
    area integer;
BEGIN
    -- Extract width and height from JSONB, with defaults
    width_val := COALESCE((room_size_data->>'width')::integer, 150);
    height_val := COALESCE((room_size_data->>'height')::integer, 100);
    
    -- Calculate area
    area := width_val * height_val;
    
    -- Categorize based on area (square feet)
    IF area < 10000 THEN
        RETURN 'small';
    ELSIF area > 30000 THEN
        RETURN 'large';
    ELSE
        RETURN 'medium';
    END IF;
END;
$function$;

-- Update room sizes to be more realistic based on room types
-- Use a safer approach that doesn't assume room_number is always numeric

-- Update courtrooms (PARTs) to be large
UPDATE rooms 
SET size = jsonb_build_object('width', 400, 'height', 300)
WHERE name ILIKE 'PART %' OR name ILIKE '%court%';

-- Update rooms that are likely small offices (higher numbers, excluding courts)
UPDATE rooms 
SET size = jsonb_build_object('width', 120, 'height', 80)
WHERE (room_number ~ '^[0-9]+$' AND room_number::integer > 900) 
AND name NOT ILIKE 'PART %' 
AND name NOT ILIKE '%court%';

-- Update rooms that are likely medium offices  
UPDATE rooms 
SET size = jsonb_build_object('width', 180, 'height', 120)
WHERE (room_number ~ '^[0-9]+$' AND room_number::integer BETWEEN 500 AND 900) 
AND name NOT ILIKE 'PART %';

-- Update rooms that are likely large administrative areas
UPDATE rooms 
SET size = jsonb_build_object('width', 250, 'height', 200)
WHERE (room_number ~ '^[0-9]+$' AND room_number::integer < 500) 
AND name NOT ILIKE 'PART %';

-- Handle non-numeric room numbers by categorizing based on name patterns
UPDATE rooms 
SET size = CASE 
    WHEN name ILIKE '%specialist%' OR name ILIKE '%clerk%' THEN jsonb_build_object('width', 120, 'height', 80)
    WHEN name ILIKE '%reporter%' OR name ILIKE '%officer%' THEN jsonb_build_object('width', 150, 'height', 100) 
    WHEN name ILIKE '%judge%' OR name ILIKE '%justice%' THEN jsonb_build_object('width', 300, 'height', 200)
    ELSE jsonb_build_object('width', 180, 'height', 120)
END
WHERE room_number !~ '^[0-9]+$' AND name NOT ILIKE 'PART %';