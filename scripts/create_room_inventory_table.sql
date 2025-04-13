-- Create room inventory table for storage rooms
CREATE TABLE IF NOT EXISTS room_inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  description TEXT,
  category TEXT,
  condition TEXT,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups by room_id
CREATE INDEX IF NOT EXISTS room_inventory_room_id_idx ON room_inventory(room_id);

-- Add comment to table
COMMENT ON TABLE room_inventory IS 'Inventory items stored in storage rooms';

-- Sample data for testing
INSERT INTO room_inventory (room_id, name, quantity, description, category, condition)
VALUES 
  -- Find a utility room ID from your database and replace the UUID below
  -- ('a1e127e9-6c91-4b47-966a-b4d4c9fe3a18', 'Filing Cabinet', 3, 'Metal filing cabinets', 'Furniture', 'Good'),
  -- ('a1e127e9-6c91-4b47-966a-b4d4c9fe3a18', 'Paper Supplies', 50, 'Boxes of printer paper', 'Office Supplies', 'New'),
  -- ('a1e127e9-6c91-4b47-966a-b4d4c9fe3a18', 'Spare Chairs', 12, 'Office chairs', 'Furniture', 'Used')
;

-- Grant permissions (adjust as needed for your application)
GRANT ALL PRIVILEGES ON TABLE room_inventory TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE room_inventory TO anon, authenticated, service_role;
