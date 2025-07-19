
-- Add enabled_modules field to profiles table to store admin module preferences
ALTER TABLE profiles 
ADD COLUMN enabled_modules JSONB DEFAULT '{
  "spaces": true,
  "issues": true, 
  "occupants": true,
  "inventory": true,
  "supply_requests": true,
  "keys": true,
  "lighting": true,
  "maintenance": true,
  "court_operations": true
}'::jsonb;

-- Update existing admin users to have all modules enabled by default
UPDATE profiles 
SET enabled_modules = '{
  "spaces": true,
  "issues": true,
  "occupants": true, 
  "inventory": true,
  "supply_requests": true,
  "keys": true,
  "lighting": true,
  "maintenance": true,
  "court_operations": true
}'::jsonb
WHERE access_level = 'admin';
