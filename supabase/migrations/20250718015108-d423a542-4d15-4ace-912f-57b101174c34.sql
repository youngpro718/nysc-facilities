-- Fix room size categorization to use actual room data and provide more realistic sizing

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
    IF area < 100 THEN
        RETURN 'small';
    ELSIF area > 300 THEN
        RETURN 'large';
    ELSE
        RETURN 'medium';
    END IF;
END;
$function$;

-- Update room sizes to be more realistic based on room types and numbers
-- Courtrooms should be larger, offices smaller, etc.

-- Update courtrooms (PARTs) to be large
UPDATE rooms 
SET size = jsonb_build_object('width', 400, 'height', 300)
WHERE name ILIKE 'PART %' OR name ILIKE '%court%';

-- Update small offices to be small (room numbers > 900 are often small offices)
UPDATE rooms 
SET size = jsonb_build_object('width', 120, 'height', 80)
WHERE room_number::integer > 900 AND name NOT ILIKE 'PART %' AND name NOT ILIKE '%court%';

-- Update medium offices (room numbers 500-900)
UPDATE rooms 
SET size = jsonb_build_object('width', 180, 'height', 120)
WHERE room_number::integer BETWEEN 500 AND 900 AND name NOT ILIKE 'PART %';

-- Update large administrative areas (room numbers < 500)
UPDATE rooms 
SET size = jsonb_build_object('width', 250, 'height', 200)
WHERE room_number::integer < 500 AND name NOT ILIKE 'PART %';

-- Create a view to easily see room sizes with their categories
CREATE OR REPLACE VIEW room_sizes_view AS
SELECT 
    id,
    name,
    room_number,
    size,
    (size->>'width')::integer as width,
    (size->>'height')::integer as height,
    ((size->>'width')::integer * (size->>'height')::integer) as area,
    get_room_size_from_data(size) as size_category
FROM rooms
ORDER BY room_number::integer;