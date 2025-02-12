
-- Add new columns to better track door purpose and relationships
ALTER TABLE doors
ADD COLUMN IF NOT EXISTS is_hallway_connection boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS connected_hallway_id uuid REFERENCES hallways(id),
ADD COLUMN IF NOT EXISTS problematic_room_id uuid REFERENCES rooms(id),
ADD COLUMN IF NOT EXISTS issue_start_date timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS original_installation_date date;

-- Add an index to help with querying problematic doors
CREATE INDEX IF NOT EXISTS idx_problematic_doors 
ON doors(problematic_room_id) 
WHERE problematic_room_id IS NOT NULL;

-- Add a view to help track door issues
CREATE OR REPLACE VIEW problematic_doors AS
SELECT 
    d.*,
    r.room_number,
    r.name as room_name,
    f.name as floor_name,
    b.name as building_name
FROM doors d
LEFT JOIN rooms r ON d.problematic_room_id = r.id
LEFT JOIN floors f ON d.floor_id = f.id
LEFT JOIN buildings b ON f.building_id = b.id
WHERE d.problematic_room_id IS NOT NULL
OR d.status = 'under_maintenance'
OR d.hardware_status->>'lock' != 'functional'
OR d.hardware_status->>'hinges' != 'functional'
OR d.hardware_status->>'doorknob' != 'functional'
OR d.hardware_status->>'frame' != 'functional'
OR d.wind_pressure_issues = true
OR d.closer_status != 'functioning';

-- Add a trigger to track when a door becomes problematic
CREATE OR REPLACE FUNCTION track_door_issues()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.problematic_room_id IS NOT NULL AND OLD.problematic_room_id IS NULL THEN
        -- If this is the first time this door is marked as problematic
        NEW.issue_start_date = CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER door_issue_tracking
    BEFORE UPDATE ON doors
    FOR EACH ROW
    EXECUTE FUNCTION track_door_issues();

COMMENT ON TABLE doors IS 'Tracks doors that either connect hallways or have maintenance issues';
COMMENT ON COLUMN doors.is_hallway_connection IS 'True if this door connects hallways';
COMMENT ON COLUMN doors.connected_hallway_id IS 'Reference to the connected hallway if this is a hallway connection';
COMMENT ON COLUMN doors.problematic_room_id IS 'Reference to the room if this door was created to track issues';
COMMENT ON COLUMN doors.issue_start_date IS 'When the door first became problematic';
COMMENT ON COLUMN doors.original_installation_date IS 'When the door was originally installed';
