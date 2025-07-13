-- Create unified maintenance schedules table
CREATE TABLE public.maintenance_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  maintenance_type TEXT NOT NULL, -- 'painting', 'flooring', 'electrical', 'hvac', 'plumbing', 'general'
  space_id UUID, -- Can reference rooms, hallways, doors, or other spaces
  space_type TEXT, -- 'room', 'hallway', 'door', 'building'
  space_name TEXT NOT NULL, -- Denormalized for easy display
  scheduled_start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  scheduled_end_date TIMESTAMP WITH TIME ZONE,
  actual_start_date TIMESTAMP WITH TIME ZONE,
  actual_end_date TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'postponed', 'cancelled'
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  impact_level TEXT DEFAULT 'minimal', -- 'none', 'minimal', 'moderate', 'significant', 'full_closure'
  assigned_to UUID, -- Staff member responsible
  contractor_info JSONB, -- External contractor details if applicable
  estimated_cost DECIMAL,
  actual_cost DECIMAL,
  notes TEXT,
  special_instructions TEXT,
  recurring_schedule JSONB, -- For recurring maintenance
  notification_sent BOOLEAN DEFAULT false,
  reminder_dates TIMESTAMP WITH TIME ZONE[],
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE public.maintenance_schedules ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated users to view maintenance schedules" 
ON public.maintenance_schedules 
FOR SELECT 
USING (true);

CREATE POLICY "Allow admin full access to maintenance schedules" 
ON public.maintenance_schedules 
FOR ALL 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Create maintenance issues table for tracking problems and temporary fixes
CREATE TABLE public.maintenance_issues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  space_id UUID, 
  space_type TEXT,
  space_name TEXT NOT NULL,
  issue_type TEXT NOT NULL, -- 'electrical', 'plumbing', 'hvac', 'structural', 'safety', 'other'
  severity TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  status TEXT NOT NULL DEFAULT 'reported', -- 'reported', 'temporary_fix', 'scheduled', 'resolved'
  temporary_fix_description TEXT,
  temporary_fix_date TIMESTAMP WITH TIME ZONE,
  permanent_solution_needed BOOLEAN DEFAULT true,
  maintenance_schedule_id UUID REFERENCES maintenance_schedules(id),
  reported_by UUID REFERENCES auth.users(id),
  assigned_to UUID,
  photos TEXT[],
  recurring_issue BOOLEAN DEFAULT false,
  last_occurrence TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  resolved_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE public.maintenance_issues ENABLE ROW LEVEL SECURITY;

-- Create policies for maintenance issues
CREATE POLICY "Allow authenticated users to view maintenance issues" 
ON public.maintenance_issues 
FOR SELECT 
USING (true);

CREATE POLICY "Allow users to report maintenance issues" 
ON public.maintenance_issues 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow admin full access to maintenance issues" 
ON public.maintenance_issues 
FOR ALL 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Create maintenance notifications table
CREATE TABLE public.maintenance_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  maintenance_schedule_id UUID REFERENCES maintenance_schedules(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  notification_type TEXT NOT NULL, -- 'scheduled', 'reminder_week', 'reminder_3days', 'reminder_1day', 'started', 'completed'
  message TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  delivery_method TEXT DEFAULT 'in_app', -- 'in_app', 'email', 'both'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE public.maintenance_notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications
CREATE POLICY "Users can view their own maintenance notifications" 
ON public.maintenance_notifications 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Allow admin full access to maintenance notifications" 
ON public.maintenance_notifications 
FOR ALL 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_maintenance_schedules_updated_at
  BEFORE UPDATE ON public.maintenance_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_maintenance_issues_updated_at
  BEFORE UPDATE ON public.maintenance_issues
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Create function to automatically notify affected users when maintenance is scheduled
CREATE OR REPLACE FUNCTION public.notify_maintenance_affected_users()
RETURNS TRIGGER AS $$
BEGIN
  -- This will be implemented to find users assigned to the affected space
  -- and create notification records
  INSERT INTO maintenance_notifications (
    maintenance_schedule_id,
    user_id,
    notification_type,
    message
  )
  SELECT 
    NEW.id,
    ora.occupant_id,
    'scheduled',
    'Maintenance scheduled: ' || NEW.title || ' in ' || NEW.space_name || 
    ' from ' || to_char(NEW.scheduled_start_date, 'Mon DD, YYYY') ||
    CASE WHEN NEW.scheduled_end_date IS NOT NULL 
         THEN ' to ' || to_char(NEW.scheduled_end_date, 'Mon DD, YYYY')
         ELSE ''
    END
  FROM occupant_room_assignments ora
  JOIN rooms r ON r.id = ora.room_id
  WHERE NEW.space_type = 'room' 
    AND (NEW.space_id = ora.room_id OR NEW.space_name = r.room_number)
    AND ora.end_date IS NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for notifications
CREATE TRIGGER maintenance_schedule_notification_trigger
  AFTER INSERT ON public.maintenance_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_maintenance_affected_users();