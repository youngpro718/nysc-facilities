-- Create profile first (this should work)
INSERT INTO profiles (id, email, first_name, last_name, is_approved, verification_status) 
VALUES (
  '272dfe36-032a-4eef-84b0-06fcec59de4e',
  'jduchate@gmail.com', 
  'Admin',
  'User',
  true,
  'verified'
) ON CONFLICT (id) DO NOTHING;

-- Now use the admin promotion function to assign role
SELECT promote_user_to_admin('272dfe36-032a-4eef-84b0-06fcec59de4e');