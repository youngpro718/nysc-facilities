-- Fix room creation schema constraints
-- Make room_number nullable to match form expectations
ALTER TABLE rooms ALTER COLUMN room_number DROP NOT NULL;

-- Ensure storage fields are properly nullable
ALTER TABLE rooms ALTER COLUMN storage_type DROP NOT NULL;
ALTER TABLE rooms ALTER COLUMN storage_capacity DROP NOT NULL;

-- Add default values for fields that might be missing
ALTER TABLE rooms ALTER COLUMN status SET DEFAULT 'active';
ALTER TABLE rooms ALTER COLUMN is_storage SET DEFAULT false;