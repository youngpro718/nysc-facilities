-- Add supply_room_staff role to user_role enum
-- This allows users to be assigned the supply_room_staff role for managing supply requests and inventory

-- Add the new value to the user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'supply_room_staff';

-- Comment on the enum to document the new role
COMMENT ON TYPE user_role IS 'User roles: admin (full access), standard (basic user), supply_room_staff (supply and inventory management)';
