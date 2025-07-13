-- Enhance court system integration with maintenance
-- Add maintenance tracking to court rooms
ALTER TABLE public.court_rooms 
ADD COLUMN maintenance_status TEXT DEFAULT 'operational',
ADD COLUMN temporary_location TEXT,
ADD COLUMN maintenance_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN maintenance_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN maintenance_notes TEXT;

-- Create court maintenance schedules view
CREATE VIEW public.court_maintenance_view AS
SELECT 
  cr.id as court_room_id,
  cr.room_number,
  cr.courtroom_number,
  cr.maintenance_status,
  cr.temporary_location,
  cr.maintenance_start_date,
  cr.maintenance_end_date,
  cr.maintenance_notes,
  ms.id as maintenance_schedule_id,
  ms.title as maintenance_title,
  ms.maintenance_type,
  ms.status as maintenance_status_detail,
  ms.scheduled_start_date,
  ms.scheduled_end_date,
  ms.priority,
  ms.impact_level,
  r.name as room_name,
  r.floor_id,
  f.name as floor_name,
  b.name as building_name
FROM court_rooms cr
LEFT JOIN rooms r ON r.room_number = cr.room_number
LEFT JOIN maintenance_schedules ms ON ms.space_name = cr.room_number AND ms.space_type = 'room'
LEFT JOIN floors f ON f.id = r.floor_id
LEFT JOIN buildings b ON b.id = f.building_id;

-- Create function to update court room maintenance status when maintenance is scheduled
CREATE OR REPLACE FUNCTION public.update_court_maintenance_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update court rooms when maintenance affects them
  IF NEW.space_type = 'room' AND NEW.impact_level IN ('significant', 'full_closure') THEN
    UPDATE court_rooms 
    SET 
      maintenance_status = CASE 
        WHEN NEW.status = 'scheduled' THEN 'maintenance_scheduled'
        WHEN NEW.status = 'in_progress' THEN 'under_maintenance'
        WHEN NEW.status = 'completed' THEN 'operational'
        ELSE maintenance_status
      END,
      maintenance_start_date = CASE WHEN NEW.status = 'in_progress' THEN NEW.actual_start_date ELSE maintenance_start_date END,
      maintenance_end_date = CASE WHEN NEW.status = 'completed' THEN NEW.actual_end_date ELSE maintenance_end_date END,
      maintenance_notes = NEW.title || ': ' || COALESCE(NEW.description, '')
    WHERE room_number = NEW.space_name;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for court maintenance updates
CREATE TRIGGER court_maintenance_status_trigger
  AFTER INSERT OR UPDATE ON public.maintenance_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_court_maintenance_status();

-- Enhance court terms with better metadata and status tracking
ALTER TABLE public.court_terms 
ADD COLUMN uploaded_pdf_path TEXT,
ADD COLUMN extracted_data JSONB DEFAULT '{}',
ADD COLUMN courtroom_assignments JSONB DEFAULT '[]',
ADD COLUMN term_status TEXT DEFAULT 'active',
ADD COLUMN notes TEXT;

-- Create court operations dashboard view
CREATE VIEW public.court_operations_dashboard AS
SELECT 
  ct.id as term_id,
  ct.term_name,
  ct.term_number,
  ct.start_date,
  ct.end_date,
  ct.status as term_status,
  ct.location,
  COUNT(DISTINCT cr.id) as total_courtrooms,
  COUNT(DISTINCT CASE WHEN cr.maintenance_status = 'operational' THEN cr.id END) as available_courtrooms,
  COUNT(DISTINCT CASE WHEN cr.maintenance_status != 'operational' THEN cr.id END) as maintenance_courtrooms,
  COUNT(DISTINCT CASE WHEN cr.temporary_location IS NOT NULL THEN cr.id END) as relocated_courtrooms,
  COUNT(DISTINCT ca.id) as active_assignments
FROM court_terms ct
LEFT JOIN court_assignments ca ON ca.term_id = ct.id
LEFT JOIN court_rooms cr ON cr.room_number = ca.room_number
WHERE ct.start_date <= CURRENT_DATE AND ct.end_date >= CURRENT_DATE
GROUP BY ct.id, ct.term_name, ct.term_number, ct.start_date, ct.end_date, ct.status, ct.location;

-- Create simple courtroom availability view
CREATE VIEW public.courtroom_availability AS
SELECT 
  cr.id,
  cr.room_number,
  cr.courtroom_number,
  cr.maintenance_status,
  cr.temporary_location,
  cr.is_active,
  CASE 
    WHEN cr.maintenance_status = 'operational' AND cr.is_active = true THEN 'available'
    WHEN cr.maintenance_status != 'operational' THEN 'maintenance'
    WHEN cr.is_active = false THEN 'inactive'
    ELSE 'unknown'
  END as availability_status,
  cr.maintenance_start_date,
  cr.maintenance_end_date,
  r.name as room_name,
  f.name as floor_name,
  b.name as building_name
FROM court_rooms cr
LEFT JOIN rooms r ON r.room_number = cr.room_number
LEFT JOIN floors f ON f.id = r.floor_id
LEFT JOIN buildings b ON b.id = f.building_id;