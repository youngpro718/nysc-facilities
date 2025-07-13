-- Enable RLS on inventory tables
ALTER TABLE inventory_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for inventory_categories (allow read access to authenticated users)
CREATE POLICY "Allow authenticated users to read categories" 
ON inventory_categories 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow admin users to manage categories" 
ON inventory_categories 
FOR ALL 
USING (auth.uid() IN (
  SELECT user_id FROM user_roles WHERE role = 'admin'
));

-- RLS policies for inventory_items (allow authenticated users to manage items)
CREATE POLICY "Allow authenticated users to read inventory items" 
ON inventory_items 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to create inventory items" 
ON inventory_items 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update inventory items" 
ON inventory_items 
FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete inventory items" 
ON inventory_items 
FOR DELETE 
USING (auth.role() = 'authenticated');