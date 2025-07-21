-- Create room_shutdowns table for managing courtroom shutdowns due to issues
CREATE TABLE IF NOT EXISTS room_shutdowns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('Project', 'Maintenance', 'Cleaning', 'Emergency', 'Issue')),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  temporary_location TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'delayed', 'cancelled')),
  project_notes TEXT,
  notifications_sent JSONB DEFAULT '{
    "major": false,
    "court_officer": false,
    "clerks": false,
    "judge": false
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES auth.users(id),
  issue_id UUID REFERENCES issues(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_room_shutdowns_room_id ON room_shutdowns(room_id);
CREATE INDEX IF NOT EXISTS idx_room_shutdowns_status ON room_shutdowns(status);
CREATE INDEX IF NOT EXISTS idx_room_shutdowns_start_date ON room_shutdowns(start_date);
CREATE INDEX IF NOT EXISTS idx_room_shutdowns_end_date ON room_shutdowns(end_date);
CREATE INDEX IF NOT EXISTS idx_room_shutdowns_issue_id ON room_shutdowns(issue_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_room_shutdowns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER room_shutdowns_updated_at
  BEFORE UPDATE ON room_shutdowns
  FOR EACH ROW
  EXECUTE FUNCTION update_room_shutdowns_updated_at();

-- Enable RLS
ALTER TABLE room_shutdowns ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view room shutdowns" ON room_shutdowns
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert room shutdowns" ON room_shutdowns
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update room shutdowns" ON room_shutdowns
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete room shutdowns" ON room_shutdowns
  FOR DELETE USING (auth.role() = 'authenticated');

-- Create a view for courtroom shutdown details with room information
CREATE OR REPLACE VIEW courtroom_shutdowns_view AS
SELECT 
  rs.*,
  r.room_number,
  cr.courtroom_number,
  f.name as floor_name,
  b.name as building_name,
  ca.justice,
  ca.clerks,
  ca.sergeant,
  i.title as issue_title,
  i.priority as issue_priority
FROM room_shutdowns rs
LEFT JOIN rooms r ON rs.room_id = r.id
LEFT JOIN court_rooms cr ON rs.room_id = cr.room_id
LEFT JOIN floors f ON r.floor_id = f.id
LEFT JOIN buildings b ON f.building_id = b.id
LEFT JOIN court_assignments ca ON rs.room_id = ca.room_id
LEFT JOIN issues i ON rs.issue_id = i.id;

-- Create a function to automatically create shutdowns for critical issues
CREATE OR REPLACE FUNCTION create_automatic_shutdown_for_critical_issue()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create automatic shutdowns for urgent issues in rooms
  IF NEW.priority = 'urgent' AND NEW.room_id IS NOT NULL THEN
    INSERT INTO room_shutdowns (
      room_id,
      reason,
      start_date,
      end_date,
      status,
      project_notes,
      issue_id,
      created_by
    ) VALUES (
      NEW.room_id,
      'Emergency',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP + INTERVAL '24 hours',
      'scheduled',
      'Automatic shutdown due to urgent issue: ' || NEW.title,
      NEW.id,
      NEW.created_by
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically create shutdowns for urgent issues
DROP TRIGGER IF EXISTS auto_shutdown_for_urgent_issues ON issues;
CREATE TRIGGER auto_shutdown_for_urgent_issues
  AFTER INSERT ON issues
  FOR EACH ROW
  EXECUTE FUNCTION create_automatic_shutdown_for_critical_issue();

-- Add comment to table
COMMENT ON TABLE room_shutdowns IS 'Manages courtroom shutdowns due to maintenance, issues, or other reasons with notification tracking';
