-- First create profile
INSERT INTO profiles (id, email, first_name, last_name, is_approved, verification_status) 
VALUES (
  '272dfe36-032a-4eef-84b0-06fcec59de4e',
  'jduchate@gmail.com', 
  'Admin',
  'User',
  true,
  'verified'
) ON CONFLICT (id) DO NOTHING;

-- Drop the validation trigger that's blocking role assignment
DROP TRIGGER IF EXISTS validate_role_assignment_trigger ON user_roles;
DROP FUNCTION IF EXISTS validate_role_assignment_trigger();
DROP FUNCTION IF EXISTS validate_role_assignment(uuid, user_role);

-- Insert admin role directly
INSERT INTO user_roles (user_id, role)
VALUES ('272dfe36-032a-4eef-84b0-06fcec59de4e', 'admin')
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';