-- Create enum for relocation status
CREATE TYPE relocation_status_enum AS ENUM ('pending', 'active', 'completed', 'cancelled');

-- Create table for temporary relocations
CREATE TABLE IF NOT EXISTS room_relocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  original_room_id UUID NOT NULL REFERENCES new_spaces(id),
  temporary_room_id UUID NOT NULL REFERENCES new_spaces(id),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  expected_end_date TIMESTAMP WITH TIME ZONE,
  actual_end_date TIMESTAMP WITH TIME ZONE,
  reason TEXT NOT NULL,
  status relocation_status_enum NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create table for schedule changes
CREATE TABLE IF NOT EXISTS schedule_changes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  relocation_id UUID REFERENCES room_relocations(id),
  original_court_part TEXT NOT NULL,
  temporary_assignment TEXT NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  special_instructions TEXT,
  status relocation_status_enum NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create table for notifications
CREATE TABLE IF NOT EXISTS relocation_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  relocation_id UUID REFERENCES room_relocations(id),
  schedule_change_id UUID REFERENCES schedule_changes(id),
  notification_type TEXT NOT NULL,
  message TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  recipients JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create view for active relocations
CREATE OR REPLACE VIEW active_relocations AS
SELECT 
  r.id,
  r.start_date,
  r.expected_end_date,
  r.reason,
  r.status,
  r.notes,
  orig.name AS original_room_name,
  orig.room_number AS original_room_number,
  orig_floor.name AS original_floor_name,
  orig_building.name AS original_building_name,
  temp.name AS temporary_room_name,
  temp.room_number AS temporary_room_number,
  temp_floor.name AS temporary_floor_name,
  temp_building.name AS temporary_building_name,
  (CURRENT_DATE - r.start_date::date) AS days_active,
  CASE 
    WHEN r.expected_end_date IS NOT NULL THEN 
      (r.expected_end_date::date - r.start_date::date)
    ELSE NULL
  END AS total_days,
  CASE 
    WHEN r.expected_end_date IS NOT NULL THEN 
      ROUND(((CURRENT_DATE - r.start_date::date)::float / 
      (r.expected_end_date::date - r.start_date::date)::float) * 100)
    ELSE NULL
  END AS progress_percentage
FROM 
  room_relocations r
JOIN 
  new_spaces orig ON r.original_room_id = orig.id
JOIN 
  new_spaces temp ON r.temporary_room_id = temp.id
JOIN 
  floors orig_floor ON orig.floor_id = orig_floor.id
JOIN 
  floors temp_floor ON temp.floor_id = temp_floor.id
JOIN 
  buildings orig_building ON orig_floor.building_id = orig_building.id
JOIN 
  buildings temp_building ON temp_floor.building_id = temp_building.id
WHERE 
  r.status = 'active';

-- Create function to update room_relocations.updated_at
CREATE OR REPLACE FUNCTION update_room_relocations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for room_relocations
CREATE TRIGGER update_room_relocations_updated_at
BEFORE UPDATE ON room_relocations
FOR EACH ROW
EXECUTE FUNCTION update_room_relocations_updated_at();

-- Create function to update schedule_changes.updated_at
CREATE OR REPLACE FUNCTION update_schedule_changes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for schedule_changes
CREATE TRIGGER update_schedule_changes_updated_at
BEFORE UPDATE ON schedule_changes
FOR EACH ROW
EXECUTE FUNCTION update_schedule_changes_updated_at(); 