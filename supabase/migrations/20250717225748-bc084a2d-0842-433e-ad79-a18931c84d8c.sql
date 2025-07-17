-- Create room key access table for internal room access management
CREATE TABLE IF NOT EXISTS room_key_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  key_id UUID REFERENCES keys(id) ON DELETE SET NULL,
  access_type TEXT NOT NULL CHECK (access_type IN ('room_entry', 'office_door', 'locker', 'cabinet', 'storage', 'key_box')),
  description TEXT,
  location_within_room TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_room_key_access_room_id ON room_key_access(room_id);
CREATE INDEX IF NOT EXISTS idx_room_key_access_key_id ON room_key_access(key_id);
CREATE INDEX IF NOT EXISTS idx_room_key_access_type ON room_key_access(access_type);

-- Enable RLS
ALTER TABLE room_key_access ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view room key access data" ON room_key_access
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage room key access" ON room_key_access
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Add passkey enabled flag to rooms
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS passkey_enabled BOOLEAN DEFAULT false;

-- Add trigger for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_room_key_access_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_room_key_access_updated_at
  BEFORE UPDATE ON room_key_access
  FOR EACH ROW
  EXECUTE FUNCTION update_room_key_access_timestamp();

-- Add real-time replication
ALTER TABLE room_key_access REPLICA IDENTITY FULL;