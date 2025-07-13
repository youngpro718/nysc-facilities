-- Add RLS policies for tables with RLS enabled but no policies

-- Backup restorations - Admin only
CREATE POLICY "Allow admin full access to backup restorations" 
ON public.backup_restorations 
FOR ALL 
USING (auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin'));

-- Emergency lighting routes - Read for all, admin for modifications
CREATE POLICY "Allow read access to emergency lighting routes" 
ON public.emergency_lighting_routes 
FOR SELECT 
USING (true);

CREATE POLICY "Allow admin full access to emergency lighting routes" 
ON public.emergency_lighting_routes 
FOR ALL 
USING (auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin'));

-- Inventory item transactions - Read for all, admin for modifications
CREATE POLICY "Allow read access to inventory transactions" 
ON public.inventory_item_transactions 
FOR SELECT 
USING (true);

CREATE POLICY "Allow admin full access to inventory transactions" 
ON public.inventory_item_transactions 
FOR ALL 
USING (auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin'));

-- Issue comments - Users can view and create, admins can manage
CREATE POLICY "Allow users to view issue comments" 
ON public.issue_comments 
FOR SELECT 
USING (true);

CREATE POLICY "Allow users to create issue comments" 
ON public.issue_comments 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow admin full access to issue comments" 
ON public.issue_comments 
FOR ALL 
USING (auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin'));

-- Issue history - Read for all, system creates entries
CREATE POLICY "Allow read access to issue history" 
ON public.issue_history 
FOR SELECT 
USING (true);

CREATE POLICY "Allow admin full access to issue history" 
ON public.issue_history 
FOR ALL 
USING (auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin'));

-- Issue priority rules - Read for all, admin manages
CREATE POLICY "Allow read access to issue priority rules" 
ON public.issue_priority_rules 
FOR SELECT 
USING (true);

CREATE POLICY "Allow admin full access to issue priority rules" 
ON public.issue_priority_rules 
FOR ALL 
USING (auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin'));

-- Issue routing rules - Read for all, admin manages
CREATE POLICY "Allow read access to issue routing rules" 
ON public.issue_routing_rules 
FOR SELECT 
USING (true);

CREATE POLICY "Allow admin full access to issue routing rules" 
ON public.issue_routing_rules 
FOR ALL 
USING (auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin'));

-- Issue templates - Read for all, admin manages
CREATE POLICY "Allow read access to issue templates" 
ON public.issue_templates 
FOR SELECT 
USING (true);

CREATE POLICY "Allow admin full access to issue templates" 
ON public.issue_templates 
FOR ALL 
USING (auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin'));

-- Issue type templates - Read for all, admin manages
CREATE POLICY "Allow read access to issue type templates" 
ON public.issue_type_templates 
FOR SELECT 
USING (true);

CREATE POLICY "Allow admin full access to issue type templates" 
ON public.issue_type_templates 
FOR ALL 
USING (auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin'));

-- Lighting maintenance - Read for all, admin manages
CREATE POLICY "Allow read access to lighting maintenance" 
ON public.lighting_maintenance 
FOR SELECT 
USING (true);

CREATE POLICY "Allow admin full access to lighting maintenance" 
ON public.lighting_maintenance 
FOR ALL 
USING (auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin'));

-- Maintenance projects - Read for all, admin manages
CREATE POLICY "Allow read access to maintenance projects" 
ON public.maintenance_projects 
FOR SELECT 
USING (true);

CREATE POLICY "Allow admin full access to maintenance projects" 
ON public.maintenance_projects 
FOR ALL 
USING (auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin'));

-- Occupant position history - Users see their own, admin sees all
CREATE POLICY "Allow users to view their own position history" 
ON public.occupant_position_history 
FOR SELECT 
USING (auth.uid() = occupant_id);

CREATE POLICY "Allow admin full access to position history" 
ON public.occupant_position_history 
FOR ALL 
USING (auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin'));

-- Occupant status history - Users see their own, admin sees all
CREATE POLICY "Allow users to view their own status history" 
ON public.occupant_status_history 
FOR SELECT 
USING (auth.uid() = occupant_id);

CREATE POLICY "Allow admin full access to status history" 
ON public.occupant_status_history 
FOR ALL 
USING (auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin'));

-- Project notifications - Admin only
CREATE POLICY "Allow admin full access to project notifications" 
ON public.project_notifications 
FOR ALL 
USING (auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin'));

-- Project phases - Read for all, admin manages
CREATE POLICY "Allow read access to project phases" 
ON public.project_phases 
FOR SELECT 
USING (true);

CREATE POLICY "Allow admin full access to project phases" 
ON public.project_phases 
FOR ALL 
USING (auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin'));

-- Room relationships - Read for all, admin manages
CREATE POLICY "Allow read access to room relationships" 
ON public.room_relationships 
FOR SELECT 
USING (true);

CREATE POLICY "Allow admin full access to room relationships" 
ON public.room_relationships 
FOR ALL 
USING (auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin'));

-- Saved filters - Users manage their own
CREATE POLICY "Allow users to manage their own saved filters" 
ON public.saved_filters 
FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow admin full access to saved filters" 
ON public.saved_filters 
FOR ALL 
USING (auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin'));

-- Service impacts - Read for all, admin manages
CREATE POLICY "Allow read access to service impacts" 
ON public.service_impacts 
FOR SELECT 
USING (true);

CREATE POLICY "Allow admin full access to service impacts" 
ON public.service_impacts 
FOR ALL 
USING (auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin'));

-- Space impacts - Read for all, admin manages
CREATE POLICY "Allow read access to space impacts" 
ON public.space_impacts 
FOR SELECT 
USING (true);

CREATE POLICY "Allow admin full access to space impacts" 
ON public.space_impacts 
FOR ALL 
USING (auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin'));

-- Spatial assignments - Read for all, admin manages
CREATE POLICY "Allow read access to spatial assignments" 
ON public.spatial_assignments 
FOR SELECT 
USING (true);

CREATE POLICY "Allow admin full access to spatial assignments" 
ON public.spatial_assignments 
FOR ALL 
USING (auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin'));