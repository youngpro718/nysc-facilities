-- Add new columns to key_requests table for enhanced functionality
ALTER TABLE key_requests 
ADD COLUMN request_type TEXT DEFAULT 'new' CHECK (request_type IN ('spare', 'replacement', 'new')),
ADD COLUMN room_id UUID REFERENCES rooms(id),
ADD COLUMN room_other TEXT,
ADD COLUMN quantity INTEGER DEFAULT 1 CHECK (quantity > 0 AND quantity <= 10),
ADD COLUMN emergency_contact TEXT,
ADD COLUMN admin_notes TEXT,
ADD COLUMN email_notifications_enabled BOOLEAN DEFAULT true;

-- Create enum for request types
CREATE TYPE request_type_enum AS ENUM ('spare', 'replacement', 'new');

-- Update the column to use the enum
ALTER TABLE key_requests ALTER COLUMN request_type TYPE request_type_enum USING request_type::request_type_enum;

-- Add index for better performance
CREATE INDEX idx_key_requests_room_id ON key_requests(room_id);
CREATE INDEX idx_key_requests_status ON key_requests(status);
CREATE INDEX idx_key_requests_created_at ON key_requests(created_at);

-- Update the trigger to handle new fields
CREATE OR REPLACE FUNCTION update_key_request_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS update_key_requests_updated_at ON key_requests;
CREATE TRIGGER update_key_requests_updated_at
    BEFORE UPDATE ON key_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_key_request_timestamp();