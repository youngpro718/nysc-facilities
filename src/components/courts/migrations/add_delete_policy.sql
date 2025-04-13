-- Add DELETE policy for court_terms table
CREATE POLICY "Allow delete for authenticated users" 
ON court_terms FOR DELETE 
TO authenticated 
USING (true);

-- Add DELETE policies for related tables
CREATE POLICY "Allow delete for authenticated users" 
ON term_assignments FOR DELETE 
TO authenticated 
USING (true);

CREATE POLICY "Allow delete for authenticated users" 
ON term_personnel FOR DELETE 
TO authenticated 
USING (true);

CREATE POLICY "Allow delete for authenticated users" 
ON court_parts FOR DELETE 
TO authenticated 
USING (true); 