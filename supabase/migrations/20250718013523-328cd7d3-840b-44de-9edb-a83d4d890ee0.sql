-- Clean up and optimize occupant_room_assignments foreign key relationships
-- First, let's ensure we have proper constraints without duplicates

-- Drop any potentially problematic constraints and recreate them cleanly
DO $$ 
BEGIN
    -- Check if foreign key constraints exist and drop if they do
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'occupant_room_assignments_occupant_id_fkey' 
        AND table_name = 'occupant_room_assignments'
    ) THEN
        ALTER TABLE occupant_room_assignments DROP CONSTRAINT occupant_room_assignments_occupant_id_fkey;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'occupant_room_assignments_room_id_fkey' 
        AND table_name = 'occupant_room_assignments'
    ) THEN
        ALTER TABLE occupant_room_assignments DROP CONSTRAINT occupant_room_assignments_room_id_fkey;
    END IF;
END $$;

-- Recreate clean foreign key relationships
ALTER TABLE occupant_room_assignments 
ADD CONSTRAINT occupant_room_assignments_occupant_id_fkey 
FOREIGN KEY (occupant_id) REFERENCES occupants(id) ON DELETE CASCADE;

ALTER TABLE occupant_room_assignments 
ADD CONSTRAINT occupant_room_assignments_room_id_fkey 
FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_occupant_room_assignments_occupant_id 
ON occupant_room_assignments(occupant_id);

CREATE INDEX IF NOT EXISTS idx_occupant_room_assignments_room_id 
ON occupant_room_assignments(room_id);

CREATE INDEX IF NOT EXISTS idx_occupant_room_assignments_active 
ON occupant_room_assignments(room_id, occupant_id) 
WHERE expiration_date IS NULL;

-- Ensure data integrity
UPDATE occupant_room_assignments 
SET occupant_id = NULL 
WHERE occupant_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM occupants WHERE id = occupant_room_assignments.occupant_id);

UPDATE occupant_room_assignments 
SET room_id = NULL 
WHERE room_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM rooms WHERE id = occupant_room_assignments.room_id);

-- Create a function to safely query room assignments without ambiguous relationships
CREATE OR REPLACE FUNCTION get_room_assignments_with_details(p_room_id UUID DEFAULT NULL)
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
AS $$
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
$$;