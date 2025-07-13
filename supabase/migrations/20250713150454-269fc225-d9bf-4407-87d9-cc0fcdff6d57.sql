-- Continue adding RLS policies for remaining tables

-- Issue routing rules - Read for all, admin manages
CREATE POLICY "Allow read access to issue routing rules" 
ON public.issue_routing_rules 
FOR SELECT 
USING (true);

CREATE POLICY "Allow admin modify issue routing rules" 
ON public.issue_routing_rules 
FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Allow admin update issue routing rules" 
ON public.issue_routing_rules 
FOR UPDATE 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Allow admin delete issue routing rules" 
ON public.issue_routing_rules 
FOR DELETE 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Issue templates - Read for all, admin manages
CREATE POLICY "Allow read access to issue templates" 
ON public.issue_templates 
FOR SELECT 
USING (true);

CREATE POLICY "Allow admin modify issue templates" 
ON public.issue_templates 
FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Allow admin update issue templates" 
ON public.issue_templates 
FOR UPDATE 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Allow admin delete issue templates" 
ON public.issue_templates 
FOR DELETE 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Issue type templates - Read for all, admin manages
CREATE POLICY "Allow read access to issue type templates" 
ON public.issue_type_templates 
FOR SELECT 
USING (true);

CREATE POLICY "Allow admin modify issue type templates" 
ON public.issue_type_templates 
FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Allow admin update issue type templates" 
ON public.issue_type_templates 
FOR UPDATE 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Allow admin delete issue type templates" 
ON public.issue_type_templates 
FOR DELETE 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Lighting maintenance - Read for all, admin manages
CREATE POLICY "Allow read access to lighting maintenance" 
ON public.lighting_maintenance 
FOR SELECT 
USING (true);

CREATE POLICY "Allow admin modify lighting maintenance" 
ON public.lighting_maintenance 
FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Allow admin update lighting maintenance" 
ON public.lighting_maintenance 
FOR UPDATE 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Allow admin delete lighting maintenance" 
ON public.lighting_maintenance 
FOR DELETE 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Maintenance projects - Read for all, admin manages
CREATE POLICY "Allow read access to maintenance projects" 
ON public.maintenance_projects 
FOR SELECT 
USING (true);

CREATE POLICY "Allow admin modify maintenance projects" 
ON public.maintenance_projects 
FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Allow admin update maintenance projects" 
ON public.maintenance_projects 
FOR UPDATE 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Allow admin delete maintenance projects" 
ON public.maintenance_projects 
FOR DELETE 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));