-- Create profile and assign admin role for the current user with correct enum value
INSERT INTO profiles (id, email, first_name, last_name, is_approved, verification_status) 
VALUES (
  '272dfe36-032a-4eef-84b0-06fcec59de4e',
  'jduchate@gmail.com', 
  'Admin',
  'User',
  true,
  'verified'
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  is_approved = true,
  verification_status = 'verified';

-- Assign admin role
INSERT INTO user_roles (user_id, role)
VALUES ('272dfe36-032a-4eef-84b0-06fcec59de4e', 'admin')
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';