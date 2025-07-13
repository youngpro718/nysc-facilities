-- Add RLS policies for tables with RLS enabled but no policies
-- Using correct column references and checking admin role properly

-- Backup restorations - Admin only
CREATE POLICY "Allow admin full access to backup restorations" 
ON public.backup_restorations 
FOR ALL 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Emergency lighting routes - Read for all, admin for modifications
CREATE POLICY "Allow read access to emergency lighting routes" 
ON public.emergency_lighting_routes 
FOR SELECT 
USING (true);

CREATE POLICY "Allow admin modify emergency lighting routes" 
ON public.emergency_lighting_routes 
FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Allow admin update emergency lighting routes" 
ON public.emergency_lighting_routes 
FOR UPDATE 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Allow admin delete emergency lighting routes" 
ON public.emergency_lighting_routes 
FOR DELETE 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Inventory item transactions - Read for all, admin for modifications
CREATE POLICY "Allow read access to inventory transactions" 
ON public.inventory_item_transactions 
FOR SELECT 
USING (true);

CREATE POLICY "Allow admin modify inventory transactions" 
ON public.inventory_item_transactions 
FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Allow admin update inventory transactions" 
ON public.inventory_item_transactions 
FOR UPDATE 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Allow admin delete inventory transactions" 
ON public.inventory_item_transactions 
FOR DELETE 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Issue comments - Users can view and create, admins can manage
CREATE POLICY "Allow users to view issue comments" 
ON public.issue_comments 
FOR SELECT 
USING (true);

CREATE POLICY "Allow users to create issue comments" 
ON public.issue_comments 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow admin update issue comments" 
ON public.issue_comments 
FOR UPDATE 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Allow admin delete issue comments" 
ON public.issue_comments 
FOR DELETE 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Issue history - Read for all, system creates entries
CREATE POLICY "Allow read access to issue history" 
ON public.issue_history 
FOR SELECT 
USING (true);

CREATE POLICY "Allow admin full access to issue history" 
ON public.issue_history 
FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Issue priority rules - Read for all, admin manages
CREATE POLICY "Allow read access to issue priority rules" 
ON public.issue_priority_rules 
FOR SELECT 
USING (true);

CREATE POLICY "Allow admin modify issue priority rules" 
ON public.issue_priority_rules 
FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Allow admin update issue priority rules" 
ON public.issue_priority_rules 
FOR UPDATE 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Allow admin delete issue priority rules" 
ON public.issue_priority_rules 
FOR DELETE 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));