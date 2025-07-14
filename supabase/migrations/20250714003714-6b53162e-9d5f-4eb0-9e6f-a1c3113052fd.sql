-- Create room_shutdowns table for detailed shutdown tracking
CREATE TABLE public.room_shutdowns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  court_room_id UUID NOT NULL REFERENCES public.court_rooms(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('maintenance', 'project', 'cleaning', 'emergency', 'inspection')),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'completed', 'delayed', 'cancelled')),
  start_date DATE NOT NULL,
  end_date DATE,
  actual_start_date TIMESTAMP WITH TIME ZONE,
  actual_end_date TIMESTAMP WITH TIME ZONE,
  title TEXT NOT NULL,
  description TEXT,
  project_details JSONB DEFAULT '{}',
  impact_level TEXT DEFAULT 'medium' CHECK (impact_level IN ('low', 'medium', 'high', 'critical')),
  temporary_location TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create shutdown_notifications table for notification tracking
CREATE TABLE public.shutdown_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shutdown_id UUID NOT NULL REFERENCES public.room_shutdowns(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('one_week', 'three_days', 'one_day', 'start', 'delay', 'completion')),
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  recipients JSONB DEFAULT '[]',
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create shutdown_schedule_changes table for tracking delays and changes
CREATE TABLE public.shutdown_schedule_changes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shutdown_id UUID NOT NULL REFERENCES public.room_shutdowns(id) ON DELETE CASCADE,
  change_type TEXT NOT NULL CHECK (change_type IN ('delay', 'advance', 'extension', 'cancellation')),
  previous_start_date DATE,
  new_start_date DATE,
  previous_end_date DATE,
  new_end_date DATE,
  reason TEXT NOT NULL,
  impact_description TEXT,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.room_shutdowns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shutdown_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shutdown_schedule_changes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for room_shutdowns
CREATE POLICY "Allow read access to authenticated users" 
ON public.room_shutdowns 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow insert for authenticated users" 
ON public.room_shutdowns 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update for authenticated users" 
ON public.room_shutdowns 
FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow delete for authenticated users" 
ON public.room_shutdowns 
FOR DELETE 
USING (auth.role() = 'authenticated');

-- Create RLS policies for shutdown_notifications
CREATE POLICY "Allow read access to authenticated users" 
ON public.shutdown_notifications 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow insert for authenticated users" 
ON public.shutdown_notifications 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update for authenticated users" 
ON public.shutdown_notifications 
FOR UPDATE 
USING (auth.role() = 'authenticated');

-- Create RLS policies for shutdown_schedule_changes
CREATE POLICY "Allow read access to authenticated users" 
ON public.shutdown_schedule_changes 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow insert for authenticated users" 
ON public.shutdown_schedule_changes 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Create indexes for performance
CREATE INDEX idx_room_shutdowns_court_room_id ON public.room_shutdowns(court_room_id);
CREATE INDEX idx_room_shutdowns_status ON public.room_shutdowns(status);
CREATE INDEX idx_room_shutdowns_dates ON public.room_shutdowns(start_date, end_date);
CREATE INDEX idx_shutdown_notifications_shutdown_id ON public.shutdown_notifications(shutdown_id);
CREATE INDEX idx_shutdown_notifications_scheduled ON public.shutdown_notifications(scheduled_for);
CREATE INDEX idx_shutdown_schedule_changes_shutdown_id ON public.shutdown_schedule_changes(shutdown_id);

-- Create function to automatically create notifications when shutdown is created
CREATE OR REPLACE FUNCTION create_shutdown_notifications()
RETURNS TRIGGER AS $$
BEGIN
  -- One week notification
  INSERT INTO shutdown_notifications (shutdown_id, notification_type, scheduled_for, message)
  VALUES (
    NEW.id,
    'one_week',
    NEW.start_date - INTERVAL '7 days',
    'Shutdown scheduled in one week: ' || NEW.title
  );
  
  -- Three days notification
  INSERT INTO shutdown_notifications (shutdown_id, notification_type, scheduled_for, message)
  VALUES (
    NEW.id,
    'three_days',
    NEW.start_date - INTERVAL '3 days',
    'Shutdown scheduled in three days: ' || NEW.title
  );
  
  -- One day notification
  INSERT INTO shutdown_notifications (shutdown_id, notification_type, scheduled_for, message)
  VALUES (
    NEW.id,
    'one_day',
    NEW.start_date - INTERVAL '1 day',
    'Shutdown scheduled tomorrow: ' || NEW.title
  );
  
  -- Start notification
  INSERT INTO shutdown_notifications (shutdown_id, notification_type, scheduled_for, message)
  VALUES (
    NEW.id,
    'start',
    NEW.start_date::timestamp with time zone,
    'Shutdown starting today: ' || NEW.title
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic notification creation
CREATE TRIGGER create_shutdown_notifications_trigger
  AFTER INSERT ON public.room_shutdowns
  FOR EACH ROW
  EXECUTE FUNCTION create_shutdown_notifications();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_shutdown_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_shutdown_updated_at_trigger
  BEFORE UPDATE ON public.room_shutdowns
  FOR EACH ROW
  EXECUTE FUNCTION update_shutdown_updated_at();

-- Enable realtime for all new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_shutdowns;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shutdown_notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shutdown_schedule_changes;

-- Also enable realtime for existing tables that need it
ALTER PUBLICATION supabase_realtime ADD TABLE public.court_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.court_assignments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.court_terms;