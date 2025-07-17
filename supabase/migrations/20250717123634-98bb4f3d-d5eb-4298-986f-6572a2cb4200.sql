-- Create room occupancy tracking table for real-time occupancy management
CREATE TABLE IF NOT EXISTS room_occupancy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  checked_in_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  checked_out_at TIMESTAMP WITH TIME ZONE NULL,
  occupancy_type TEXT NOT NULL DEFAULT 'work' CHECK (occupancy_type IN ('work', 'meeting', 'court_session', 'maintenance')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_room_occupancy_room_id ON room_occupancy(room_id);
CREATE INDEX IF NOT EXISTS idx_room_occupancy_user_id ON room_occupancy(user_id);
CREATE INDEX IF NOT EXISTS idx_room_occupancy_active ON room_occupancy(room_id, checked_out_at) WHERE checked_out_at IS NULL;

-- Enable RLS
ALTER TABLE room_occupancy ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view room occupancy data" ON room_occupancy
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own occupancy records" ON room_occupancy
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all occupancy records" ON room_occupancy
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_room_occupancy_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_room_occupancy_updated_at
  BEFORE UPDATE ON room_occupancy
  FOR EACH ROW
  EXECUTE FUNCTION update_room_occupancy_timestamp();

-- Add real-time replication
ALTER TABLE room_occupancy REPLICA IDENTITY FULL;
SELECT pg_catalog.pg_advisory_unlock_all();