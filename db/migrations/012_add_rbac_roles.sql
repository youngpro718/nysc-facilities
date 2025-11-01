-- Migration: Add RBAC Roles (CMC, Court Aide, Purchasing Staff)
-- Date: 2025-10-26
-- Purpose: Add new role types for comprehensive role-based access control

-- Update profiles table role constraint to include new roles
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_role_check 
CHECK (role IN (
  -- New RBAC roles
  'admin',
  'cmc',                          -- Court Management Coordinator
  'court_aide',                   -- Supply staff (orders, room, inventory)
  'purchasing_staff',             -- Purchasing (view inventory/supply room)
  
  -- Existing roles
  'supply_room_staff',            -- Legacy - maps to court_aide
  'facilities_manager',
  'judge',
  'clerk',
  'sergeant',
  'court_officer',
  'bailiff',
  'court_reporter',
  'administrative_assistant',
  'standard',
  
  -- Legacy roles for backward compatibility
  'coordinator',
  'it_dcas',
  'viewer'
));

-- Update role column comment with new role descriptions
COMMENT ON COLUMN public.profiles.role IS 'User role: admin (full access), cmc (court operations), court_aide (supply staff - orders/room/inventory), purchasing_staff (view inventory/supply room), facilities_manager (building management), standard (basic user)';

-- Create helper function to map legacy roles to new roles
CREATE OR REPLACE FUNCTION public.map_legacy_role(legacy_role text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  CASE legacy_role
    WHEN 'coordinator' THEN RETURN 'admin';
    WHEN 'it_dcas' THEN RETURN 'admin';
    WHEN 'viewer' THEN RETURN 'standard';
    WHEN 'supply_room_staff' THEN RETURN 'court_aide';
    ELSE RETURN legacy_role;
  END CASE;
END;
$$;

COMMENT ON FUNCTION public.map_legacy_role(text) IS 'Maps legacy role names to new RBAC role names for backward compatibility';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.map_legacy_role(text) TO authenticated;

-- Add index on role column for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Migration verification query (run this to verify)
-- SELECT role, COUNT(*) as user_count 
-- FROM public.profiles 
-- GROUP BY role 
-- ORDER BY user_count DESC;

-- Example: Update existing users to new roles (UNCOMMENT AND MODIFY AS NEEDED)
-- UPDATE public.profiles SET role = 'cmc' WHERE email IN ('cmc@example.com');
-- UPDATE public.profiles SET role = 'court_aide' WHERE email IN ('aide@example.com');
-- UPDATE public.profiles SET role = 'purchasing_staff' WHERE email IN ('purchasing@example.com');

-- Add helpful comments
COMMENT ON TABLE public.profiles IS 'User profiles with comprehensive role-based access control. Roles: admin (full), cmc (court ops), court_aide (supply staff), purchasing_staff (view inventory/supply room), standard (basic user)';
