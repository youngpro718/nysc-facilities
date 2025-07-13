-- Simplify lighting_fixtures table structure
-- Add essential fields for tracking light status
ALTER TABLE lighting_fixtures 
ADD COLUMN IF NOT EXISTS reported_out_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS replaced_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS requires_electrician BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS room_number TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Update existing records to have room numbers if available
UPDATE lighting_fixtures 
SET room_number = (
  SELECT r.room_number 
  FROM rooms r 
  WHERE r.id = lighting_fixtures.space_id
)
WHERE room_number IS NULL AND space_id IS NOT NULL;

-- Create a simple index for quick filtering
CREATE INDEX IF NOT EXISTS idx_lighting_fixtures_status ON lighting_fixtures(status);
CREATE INDEX IF NOT EXISTS idx_lighting_fixtures_requires_electrician ON lighting_fixtures(requires_electrician);
CREATE INDEX IF NOT EXISTS idx_lighting_fixtures_reported_out ON lighting_fixtures(reported_out_date);

-- Update RLS policies for simplified access
DROP POLICY IF EXISTS "lighting_fixtures_select_policy" ON lighting_fixtures;
DROP POLICY IF EXISTS "lighting_fixtures_insert_policy" ON lighting_fixtures;
DROP POLICY IF EXISTS "lighting_fixtures_update_policy" ON lighting_fixtures;
DROP POLICY IF EXISTS "lighting_fixtures_delete_policy" ON lighting_fixtures;

CREATE POLICY "Enable read access for all authenticated users" ON lighting_fixtures
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON lighting_fixtures
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON lighting_fixtures
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for admin users" ON lighting_fixtures
FOR DELETE USING (auth.uid() IN (
  SELECT user_id FROM user_roles WHERE role = 'admin'
));