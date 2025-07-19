
-- Create court roles enum for Supreme Court staff positions
CREATE TYPE public.court_role AS ENUM (
  'judge',
  'court_aide', 
  'clerk',
  'sergeant',
  'court_officer',
  'bailiff',
  'court_reporter',
  'administrative_assistant',
  'facilities_manager',
  'admin'
);

-- Update user_roles table to use court_role instead of generic role
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;
ALTER TABLE public.user_roles ALTER COLUMN role TYPE court_role USING role::text::court_role;

-- Update occupants table to use role instead of department
ALTER TABLE public.occupants ADD COLUMN role court_role;
ALTER TABLE public.occupants ADD COLUMN court_position TEXT;

-- Update existing occupants based on department mapping
UPDATE public.occupants SET 
  role = CASE 
    WHEN department ILIKE '%judge%' THEN 'judge'::court_role
    WHEN department ILIKE '%clerk%' THEN 'clerk'::court_role  
    WHEN department ILIKE '%sergeant%' THEN 'sergeant'::court_role
    WHEN department ILIKE '%officer%' THEN 'court_officer'::court_role
    WHEN department ILIKE '%admin%' THEN 'admin'::court_role
    WHEN department ILIKE '%facilities%' THEN 'facilities_manager'::court_role
    ELSE 'clerk'::court_role -- default for unknown departments
  END
WHERE role IS NULL;

-- Create role permissions table
CREATE TABLE public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role court_role NOT NULL,
  feature TEXT NOT NULL,
  permission TEXT NOT NULL, -- 'read', 'write', 'admin'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(role, feature)
);

-- Insert role permissions based on Supreme Court requirements
INSERT INTO public.role_permissions (role, feature, permission) VALUES
-- Judge permissions (limited access)
('judge', 'issues', 'write'),
('judge', 'supply_requests', 'write'), 
('judge', 'keys', 'write'),
('judge', 'dashboard', 'read'),

-- Court Aide permissions (inventory and supply focus)
('court_aide', 'inventory', 'admin'),
('court_aide', 'supply_requests', 'admin'),
('court_aide', 'issues', 'write'),
('court_aide', 'keys', 'read'),
('court_aide', 'occupants', 'read'),
('court_aide', 'spaces', 'read'),
('court_aide', 'dashboard', 'read'),

-- Clerk permissions (moderate access)
('clerk', 'issues', 'write'),
('clerk', 'supply_requests', 'write'),
('clerk', 'keys', 'write'),
('clerk', 'occupants', 'read'),
('clerk', 'dashboard', 'read'),

-- Sergeant/Court Officer permissions (security focus)
('sergeant', 'keys', 'admin'),
('sergeant', 'occupants', 'read'),
('sergeant', 'spaces', 'read'),
('sergeant', 'issues', 'write'),
('sergeant', 'dashboard', 'read'),

('court_officer', 'keys', 'write'),
('court_officer', 'occupants', 'read'),
('court_officer', 'issues', 'write'),
('court_officer', 'dashboard', 'read'),

-- Facilities Manager permissions (comprehensive facility access)
('facilities_manager', 'spaces', 'admin'),
('facilities_manager', 'maintenance', 'admin'),
('facilities_manager', 'lighting', 'admin'),
('facilities_manager', 'keys', 'admin'),
('facilities_manager', 'occupants', 'admin'),
('facilities_manager', 'issues', 'admin'),
('facilities_manager', 'inventory', 'write'),
('facilities_manager', 'supply_requests', 'write'),
('facilities_manager', 'dashboard', 'admin'),

-- Administrative Assistant permissions (occupant and scheduling focus)
('administrative_assistant', 'occupants', 'admin'),
('administrative_assistant', 'issues', 'write'),
('administrative_assistant', 'supply_requests', 'write'),
('administrative_assistant', 'keys', 'write'),
('administrative_assistant', 'dashboard', 'read'),

-- Admin permissions (full access)
('admin', 'spaces', 'admin'),
('admin', 'issues', 'admin'),
('admin', 'occupants', 'admin'),
('admin', 'inventory', 'admin'),
('admin', 'supply_requests', 'admin'),
('admin', 'keys', 'admin'),
('admin', 'lighting', 'admin'),
('admin', 'maintenance', 'admin'),
('admin', 'court_operations', 'admin'),
('admin', 'dashboard', 'admin');

-- Create function to check role permissions
CREATE OR REPLACE FUNCTION public.has_role_permission(user_id UUID, feature_name TEXT, required_permission TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN role_permissions rp ON ur.role = rp.role
    WHERE ur.user_id = $1 
    AND rp.feature = $2
    AND (
      rp.permission = $3 
      OR (rp.permission = 'admin' AND $3 IN ('read', 'write'))
      OR (rp.permission = 'write' AND $3 = 'read')
    )
  );
$$;

-- Create function to get user role
CREATE OR REPLACE FUNCTION public.get_user_court_role(user_id UUID)
RETURNS court_role
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM user_roles WHERE user_id = $1 LIMIT 1;
$$;

-- Update RLS policies to use new role system
DROP POLICY IF EXISTS "Admin users can manage department access" ON department_access;
CREATE POLICY "Admin users can manage department access"
ON department_access
FOR ALL
TO authenticated
USING (has_role_permission(auth.uid(), 'occupants', 'admin'));

-- Enable RLS on role_permissions
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view role permissions"
ON role_permissions
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admin can manage role permissions"
ON role_permissions
FOR ALL
TO authenticated
USING (has_role_permission(auth.uid(), 'dashboard', 'admin'));
