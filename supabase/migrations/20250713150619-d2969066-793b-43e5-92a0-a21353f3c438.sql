-- Simple RLS policies for remaining tables - Admin only access

-- Project notifications - Admin only
CREATE POLICY "Allow admin full access to project notifications" 
ON public.project_notifications 
FOR ALL 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Project phases - Admin manages
CREATE POLICY "Allow admin full access to project phases" 
ON public.project_phases 
FOR ALL 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Room relationships - Admin manages
CREATE POLICY "Allow admin full access to room relationships" 
ON public.room_relationships 
FOR ALL 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Saved filters - Admin only for now
CREATE POLICY "Allow admin full access to saved filters" 
ON public.saved_filters 
FOR ALL 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Service impacts - Admin manages
CREATE POLICY "Allow admin full access to service impacts" 
ON public.service_impacts 
FOR ALL 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Space impacts - Admin manages
CREATE POLICY "Allow admin full access to space impacts" 
ON public.space_impacts 
FOR ALL 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Spatial assignments - Admin manages
CREATE POLICY "Allow admin full access to spatial assignments" 
ON public.spatial_assignments 
FOR ALL 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Occupant position history - Admin only for now
CREATE POLICY "Allow admin full access to position history" 
ON public.occupant_position_history 
FOR ALL 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Occupant status history - Admin only for now
CREATE POLICY "Allow admin full access to status history" 
ON public.occupant_status_history 
FOR ALL 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));