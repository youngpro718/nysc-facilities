-- Update RLS policies for supply_requests to allow admin users access

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Supply department can view all requests" ON supply_requests;
DROP POLICY IF EXISTS "Supply department can update requests" ON supply_requests;

-- Create new policy that allows admins OR supply/administration departments to view all requests
CREATE POLICY "Admins and supply department can view all requests"
ON supply_requests FOR SELECT
USING (
  -- Allow users to see their own requests
  requester_id = auth.uid() OR
  -- Allow admin users to see all requests
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  ) OR
  -- Allow Supply and Administration departments to see all requests
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND department IN ('Supply', 'Administration')
  )
);

-- Create new policy that allows admins OR supply/administration departments to update requests
CREATE POLICY "Admins and supply department can update requests"
ON supply_requests FOR UPDATE
USING (
  -- Allow admin users to update all requests
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  ) OR
  -- Allow Supply and Administration departments to update all requests
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND department IN ('Supply', 'Administration')
  )
);