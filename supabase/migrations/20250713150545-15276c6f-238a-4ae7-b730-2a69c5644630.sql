-- Final batch of RLS policies for remaining tables

-- Occupant position history - Users see their own, admin sees all
CREATE POLICY "Allow users to view their own position history" 
ON public.occupant_position_history 
FOR SELECT 
USING (auth.uid() = occupant_id);

CREATE POLICY "Allow admin full access to position history" 
ON public.occupant_position_history 
FOR ALL 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Occupant status history - Users see their own, admin sees all
CREATE POLICY "Allow users to view their own status history" 
ON public.occupant_status_history 
FOR SELECT 
USING (auth.uid() = occupant_id);

CREATE POLICY "Allow admin full access to status history" 
ON public.occupant_status_history 
FOR ALL 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Project notifications - Admin only
CREATE POLICY "Allow admin full access to project notifications" 
ON public.project_notifications 
FOR ALL 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Project phases - Read for all, admin manages
CREATE POLICY "Allow read access to project phases" 
ON public.project_phases 
FOR SELECT 
USING (true);

CREATE POLICY "Allow admin modify project phases" 
ON public.project_phases 
FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Allow admin update project phases" 
ON public.project_phases 
FOR UPDATE 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Allow admin delete project phases" 
ON public.project_phases 
FOR DELETE 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Room relationships - Read for all, admin manages
CREATE POLICY "Allow read access to room relationships" 
ON public.room_relationships 
FOR SELECT 
USING (true);

CREATE POLICY "Allow admin modify room relationships" 
ON public.room_relationships 
FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Allow admin update room relationships" 
ON public.room_relationships 
FOR UPDATE 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Allow admin delete room relationships" 
ON public.room_relationships 
FOR DELETE 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Saved filters - Users manage their own
CREATE POLICY "Allow users to manage their own saved filters" 
ON public.saved_filters 
FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow admin full access to saved filters" 
ON public.saved_filters 
FOR ALL 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Service impacts - Read for all, admin manages
CREATE POLICY "Allow read access to service impacts" 
ON public.service_impacts 
FOR SELECT 
USING (true);

CREATE POLICY "Allow admin modify service impacts" 
ON public.service_impacts 
FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Allow admin update service impacts" 
ON public.service_impacts 
FOR UPDATE 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Allow admin delete service impacts" 
ON public.service_impacts 
FOR DELETE 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Space impacts - Read for all, admin manages
CREATE POLICY "Allow read access to space impacts" 
ON public.space_impacts 
FOR SELECT 
USING (true);

CREATE POLICY "Allow admin modify space impacts" 
ON public.space_impacts 
FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Allow admin update space impacts" 
ON public.space_impacts 
FOR UPDATE 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Allow admin delete space impacts" 
ON public.space_impacts 
FOR DELETE 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Spatial assignments - Read for all, admin manages
CREATE POLICY "Allow read access to spatial assignments" 
ON public.spatial_assignments 
FOR SELECT 
USING (true);

CREATE POLICY "Allow admin modify spatial assignments" 
ON public.spatial_assignments 
FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Allow admin update spatial assignments" 
ON public.spatial_assignments 
FOR UPDATE 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Allow admin delete spatial assignments" 
ON public.spatial_assignments 
FOR DELETE 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));