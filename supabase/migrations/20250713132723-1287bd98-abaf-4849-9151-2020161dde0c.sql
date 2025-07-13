-- Create RLS policies for key_requests table
-- First enable RLS on the table
ALTER TABLE key_requests ENABLE ROW LEVEL SECURITY;

-- Allow users to create key requests for themselves
CREATE POLICY "Users can create their own key requests" 
ON key_requests FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own key requests
CREATE POLICY "Users can view their own key requests" 
ON key_requests FOR SELECT 
USING (auth.uid() = user_id);

-- Allow users to update their own key requests (if needed for cancellation etc)
CREATE POLICY "Users can update their own key requests" 
ON key_requests FOR UPDATE 
USING (auth.uid() = user_id);

-- Allow admins to view all key requests
CREATE POLICY "Admins can view all key requests"
ON key_requests FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Allow admins to update all key requests (approve/reject)
CREATE POLICY "Admins can update all key requests"
ON key_requests FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);