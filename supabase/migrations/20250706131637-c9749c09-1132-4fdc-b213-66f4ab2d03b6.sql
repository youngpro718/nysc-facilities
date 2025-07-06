-- Phase 1: Database validation and repair for parent-child room relationships

-- First, establish existing parent-child relationships where both rooms exist
UPDATE rooms 
SET parent_room_id = (
  SELECT p.id 
  FROM rooms p 
  WHERE p.room_number = REGEXP_REPLACE(rooms.room_number, '[A-Z]+$', '')
  AND p.floor_id = rooms.floor_id
)
WHERE room_number ~ '^[0-9]+[A-Z]+$'
AND EXISTS (
  SELECT 1 
  FROM rooms parent 
  WHERE parent.room_number = REGEXP_REPLACE(rooms.room_number, '[A-Z]+$', '')
  AND parent.floor_id = rooms.floor_id
);

-- Create validation function to prevent circular parent-child references
CREATE OR REPLACE FUNCTION validate_parent_room_hierarchy()
RETURNS TRIGGER AS $$
DECLARE
    current_parent_id UUID;
    iteration_count INTEGER := 0;
    max_iterations INTEGER := 100; -- Prevent infinite loops
BEGIN
    -- If no parent is being set, allow it
    IF NEW.parent_room_id IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- A room cannot be its own parent
    IF NEW.id = NEW.parent_room_id THEN
        RAISE EXCEPTION 'A room cannot be its own parent';
    END IF;
    
    -- Check that parent and child are on the same floor
    IF NOT EXISTS (
        SELECT 1 FROM rooms 
        WHERE id = NEW.parent_room_id 
        AND floor_id = NEW.floor_id
    ) THEN
        RAISE EXCEPTION 'Parent room must be on the same floor as child room';
    END IF;
    
    -- Check for circular references by walking up the parent chain
    current_parent_id := NEW.parent_room_id;
    
    WHILE current_parent_id IS NOT NULL AND iteration_count < max_iterations LOOP
        -- If we find our own ID in the parent chain, it's circular
        IF current_parent_id = NEW.id THEN
            RAISE EXCEPTION 'Circular parent-child relationship detected';
        END IF;
        
        -- Get the next parent in the chain
        SELECT parent_room_id INTO current_parent_id
        FROM rooms 
        WHERE id = current_parent_id;
        
        iteration_count := iteration_count + 1;
    END LOOP;
    
    -- If we hit max iterations, something is wrong
    IF iteration_count >= max_iterations THEN
        RAISE EXCEPTION 'Parent hierarchy is too deep or contains a loop';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate parent-child relationships
CREATE TRIGGER validate_room_parent_hierarchy
    BEFORE INSERT OR UPDATE ON rooms
    FOR EACH ROW
    EXECUTE FUNCTION validate_parent_room_hierarchy();

-- Create function to get all child rooms recursively
CREATE OR REPLACE FUNCTION get_child_rooms(parent_room_id UUID)
RETURNS TABLE(
    child_id UUID,
    child_name TEXT,
    child_room_number TEXT,
    depth INTEGER
) AS $$
WITH RECURSIVE room_hierarchy AS (
    -- Base case: direct children
    SELECT 
        id as child_id,
        name as child_name,
        room_number as child_room_number,
        1 as depth
    FROM rooms 
    WHERE parent_room_id = $1
    
    UNION ALL
    
    -- Recursive case: children of children
    SELECT 
        r.id as child_id,
        r.name as child_name,
        r.room_number as child_room_number,
        rh.depth + 1 as depth
    FROM rooms r
    INNER JOIN room_hierarchy rh ON r.parent_room_id = rh.child_id
    WHERE rh.depth < 10 -- Prevent infinite recursion
)
SELECT * FROM room_hierarchy ORDER BY depth, child_room_number;
$$ LANGUAGE sql STABLE;

-- Create function to get parent room chain
CREATE OR REPLACE FUNCTION get_parent_chain(child_room_id UUID)
RETURNS TABLE(
    parent_id UUID,
    parent_name TEXT,
    parent_room_number TEXT,
    level INTEGER
) AS $$
WITH RECURSIVE parent_chain AS (
    -- Base case: direct parent
    SELECT 
        p.id as parent_id,
        p.name as parent_name,
        p.room_number as parent_room_number,
        1 as level
    FROM rooms r
    JOIN rooms p ON r.parent_room_id = p.id
    WHERE r.id = $1
    
    UNION ALL
    
    -- Recursive case: parent of parent
    SELECT 
        p.id as parent_id,
        p.name as parent_name,
        p.room_number as parent_room_number,
        pc.level + 1 as level
    FROM rooms p
    INNER JOIN parent_chain pc ON p.id = (
        SELECT parent_room_id FROM rooms WHERE id = pc.parent_id
    )
    WHERE pc.level < 10 -- Prevent infinite recursion
)
SELECT * FROM parent_chain ORDER BY level;
$$ LANGUAGE sql STABLE;

-- Add index for better performance on parent_room_id queries
CREATE INDEX IF NOT EXISTS idx_rooms_parent_room_id ON rooms(parent_room_id);

-- Create view for room hierarchy information
CREATE OR REPLACE VIEW room_hierarchy_view AS
SELECT 
    r.id,
    r.name,
    r.room_number,
    r.floor_id,
    r.parent_room_id,
    p.name as parent_name,
    p.room_number as parent_room_number,
    CASE 
        WHEN r.parent_room_id IS NULL THEN 'parent'
        ELSE 'child'
    END as room_role,
    (SELECT COUNT(*) FROM rooms WHERE parent_room_id = r.id) as child_count
FROM rooms r
LEFT JOIN rooms p ON r.parent_room_id = p.id;

-- Grant permissions
GRANT SELECT ON room_hierarchy_view TO authenticated;
GRANT EXECUTE ON FUNCTION get_child_rooms(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_parent_chain(UUID) TO authenticated;