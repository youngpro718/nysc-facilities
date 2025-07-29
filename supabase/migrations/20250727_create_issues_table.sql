-- Create the main issues table that the application expects
-- This will be the central table for all types of issues

-- First, create the issue_status_enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE issue_status_enum AS ENUM ('open', 'in_progress', 'resolved', 'closed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create the main issues table
CREATE TABLE IF NOT EXISTS public.issues (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    issue_type TEXT NOT NULL, -- 'electrical', 'plumbing', 'hvac', 'structural', 'safety', 'lighting', 'other'
    priority TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    status issue_status_enum NOT NULL DEFAULT 'open',
    
    -- Location information
    building_id UUID,
    floor_id UUID,
    room_id UUID,
    space_id UUID,
    space_type TEXT,
    location_description TEXT,
    
    -- Assignment and tracking
    reported_by UUID REFERENCES auth.users(id),
    assigned_to UUID REFERENCES auth.users(id),
    
    -- Additional details
    photos TEXT[],
    attachments TEXT[],
    tags TEXT[],
    
    -- Resolution information
    resolution_notes TEXT,
    resolved_by UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated users to view issues" 
ON public.issues 
FOR SELECT 
USING (true);

CREATE POLICY "Allow authenticated users to create issues" 
ON public.issues 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to update their own issues" 
ON public.issues 
FOR UPDATE 
USING (reported_by = auth.uid() OR assigned_to = auth.uid());

CREATE POLICY "Allow admin full access to issues" 
ON public.issues 
FOR ALL 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_issues_status ON public.issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_priority ON public.issues(priority);
CREATE INDEX IF NOT EXISTS idx_issues_issue_type ON public.issues(issue_type);
CREATE INDEX IF NOT EXISTS idx_issues_reported_by ON public.issues(reported_by);
CREATE INDEX IF NOT EXISTS idx_issues_assigned_to ON public.issues(assigned_to);
CREATE INDEX IF NOT EXISTS idx_issues_room_id ON public.issues(room_id);
CREATE INDEX IF NOT EXISTS idx_issues_created_at ON public.issues(created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_issues_updated_at ON public.issues;
CREATE TRIGGER update_issues_updated_at
    BEFORE UPDATE ON public.issues
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.issues TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Insert some sample data to test
INSERT INTO public.issues (title, description, issue_type, priority, location_description) VALUES
('Flickering Light in Room 101', 'The overhead light in Room 101 is flickering intermittently', 'lighting', 'medium', 'Room 101 - Main overhead fixture'),
('Broken Door Handle', 'Door handle is loose and needs repair', 'maintenance', 'low', 'Main entrance door'),
('HVAC Not Working', 'Air conditioning unit not cooling properly', 'hvac', 'high', 'Conference room HVAC unit')
ON CONFLICT (id) DO NOTHING;
