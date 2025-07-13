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