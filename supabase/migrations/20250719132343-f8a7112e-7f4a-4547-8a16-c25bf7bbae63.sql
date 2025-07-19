
-- Add fields to track original room type and temporary storage use
ALTER TABLE rooms 
ADD COLUMN original_room_type text,
ADD COLUMN temporary_storage_use boolean DEFAULT false;

-- Update existing rooms that are currently storage to preserve their original type
-- This is a one-time update to set original_room_type for existing storage rooms
UPDATE rooms 
SET original_room_type = room_type,
    temporary_storage_use = true
WHERE is_storage = true AND room_type != 'utility_room';

-- Create new simplified storage type enum
CREATE TYPE simplified_storage_type_enum AS ENUM (
  'files',
  'supplies', 
  'furniture',
  'equipment',
  'general'
);

-- Add new storage type column
ALTER TABLE rooms 
ADD COLUMN simplified_storage_type simplified_storage_type_enum;

-- Migrate existing storage types to simplified ones
UPDATE rooms 
SET simplified_storage_type = CASE 
  WHEN storage_type = 'general' THEN 'general'::simplified_storage_type_enum
  WHEN storage_type = 'secure' THEN 'files'::simplified_storage_type_enum
  WHEN storage_type = 'archive' THEN 'files'::simplified_storage_type_enum
  WHEN storage_type = 'climate_controlled' THEN 'equipment'::simplified_storage_type_enum
  WHEN storage_type = 'hazardous' THEN 'equipment'::simplified_storage_type_enum
  ELSE 'general'::simplified_storage_type_enum
END
WHERE is_storage = true;

-- Add capacity size helper column for user-friendly input
ALTER TABLE rooms 
ADD COLUMN capacity_size_category text;

-- Set capacity size categories based on existing storage_capacity
UPDATE rooms 
SET capacity_size_category = CASE 
  WHEN storage_capacity IS NULL THEN NULL
  WHEN storage_capacity < 100 THEN 'small'
  WHEN storage_capacity < 500 THEN 'medium'
  WHEN storage_capacity < 1500 THEN 'large'
  ELSE 'extra_large'
END
WHERE is_storage = true;

-- Update the room form schema enum values in the database
COMMENT ON COLUMN rooms.simplified_storage_type IS 'Simplified storage categories: files (documents, records), supplies (office supplies), furniture (chairs, desks), equipment (IT, specialized), general (mixed)';
COMMENT ON COLUMN rooms.capacity_size_category IS 'User-friendly capacity categories: small (<100 cf), medium (100-500 cf), large (500-1500 cf), extra_large (1500+ cf)';
