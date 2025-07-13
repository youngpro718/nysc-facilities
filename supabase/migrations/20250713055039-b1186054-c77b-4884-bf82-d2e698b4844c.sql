-- Add admin role to jduchate@gmail.com directly
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'::user_role
FROM auth.users 
WHERE email = 'jduchate@gmail.com'
AND NOT EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.users.id 
  AND role = 'admin'::user_role
);