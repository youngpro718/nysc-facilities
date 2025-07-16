-- Add missing DELETE and UPDATE policies for occupant_room_assignments table

-- Allow authenticated users to update room assignments
CREATE POLICY "Allow authenticated users to update room assignments" 
ON public.occupant_room_assignments 
FOR UPDATE 
TO authenticated 
USING (auth.role() = 'authenticated'::text)
WITH CHECK (auth.role() = 'authenticated'::text);

-- Allow authenticated users to delete room assignments
CREATE POLICY "Allow authenticated users to delete room assignments" 
ON public.occupant_room_assignments 
FOR DELETE 
TO authenticated 
USING (auth.role() = 'authenticated'::text);