-- Create court rooms table to match the expected schema in the application

-- Step 1: Create court_rooms table that links to the existing rooms table
CREATE TABLE IF NOT EXISTS court_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES rooms(id),
    room_number TEXT NOT NULL,
    courtroom_number TEXT,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create index for performance
CREATE INDEX IF NOT EXISTS idx_court_rooms_room_id ON court_rooms(room_id);

-- Step 3: Set up RLS policies
ALTER TABLE court_rooms ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Allow read for authenticated users" 
ON court_rooms FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow insert for authenticated users" 
ON court_rooms FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Allow update for authenticated users" 
ON court_rooms FOR UPDATE 
TO authenticated 
USING (true);

-- Step 4: Add function to automatically populate this table from the main rooms table
-- This will create court_rooms entries for rooms that have a specific room_type
CREATE OR REPLACE FUNCTION create_court_room_from_room()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if the room is a courtroom type (assuming there's an enum or identifier for courtrooms)
    -- Adjust the condition below based on how courtrooms are identified in your system
    IF NEW.room_type = 'courtroom' THEN
        -- Create a court_room record
        INSERT INTO court_rooms (room_id, room_number)
        VALUES (NEW.id, NEW.room_number);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create court_room records
CREATE TRIGGER create_court_room_trigger
AFTER INSERT ON rooms
FOR EACH ROW
EXECUTE FUNCTION create_court_room_from_room();

-- Step 5: Populate existing court rooms
INSERT INTO court_rooms (room_id, room_number)
SELECT id, room_number
FROM rooms
WHERE room_type = 'courtroom'
AND id NOT IN (SELECT room_id FROM court_rooms);

COMMENT ON TABLE court_rooms IS 'Specialized table for tracking courtrooms with additional court-specific attributes'; 