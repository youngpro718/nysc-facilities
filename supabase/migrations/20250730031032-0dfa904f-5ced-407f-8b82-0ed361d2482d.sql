-- Fix security issues by dropping and recreating views without SECURITY DEFINER
-- and updating functions with proper search_path

-- Drop and recreate views without SECURITY DEFINER
DROP VIEW IF EXISTS key_assignments_view;
DROP VIEW IF EXISTS key_inventory_view; 
DROP VIEW IF EXISTS elevator_pass_assignments;

-- Recreate views as regular views (not SECURITY DEFINER)
CREATE VIEW key_assignments_view AS
SELECT 
  ka.key_id,
  COUNT(CASE WHEN ka.status IN ('assigned', 'active') THEN 1 END) as active_assignments,
  COUNT(CASE WHEN ka.status = 'returned' THEN 1 END) as returned_assignments,
  COUNT(CASE WHEN ka.status = 'lost' THEN 1 END) as lost_count
FROM key_assignments ka
GROUP BY ka.key_id;

CREATE VIEW key_inventory_view AS
SELECT 
  k.id,
  k.name,
  k.type,
  k.status,
  k.total_quantity,
  k.available_quantity,
  k.is_passkey,
  k.key_scope,
  k.properties,
  k.location_data,
  k.captain_office_copy,
  k.captain_office_assigned_date,
  k.captain_office_notes,
  k.created_at,
  k.updated_at,
  COALESCE(av.active_assignments, 0) as active_assignments,
  COALESCE(av.returned_assignments, 0) as returned_assignments,
  COALESCE(av.lost_count, 0) as lost_count
FROM keys k
LEFT JOIN key_assignments_view av ON k.id = av.key_id;

CREATE VIEW elevator_pass_assignments AS
SELECT 
  ka.id as assignment_id,
  ka.key_id,
  ka.occupant_id,
  ka.assigned_at,
  ka.returned_at,
  ka.status,
  ka.return_reason,
  ka.is_spare,
  ka.spare_key_reason,
  k.name as key_name,
  o.first_name,
  o.last_name,
  o.department,
  o.email,
  CASE 
    WHEN ka.status IN ('assigned', 'active') AND ka.assigned_at + INTERVAL '30 days' < NOW() THEN true
    ELSE false
  END as is_overdue,
  EXTRACT(days FROM (NOW() - ka.assigned_at))::INTEGER as days_since_assigned
FROM key_assignments ka
JOIN keys k ON ka.key_id = k.id AND k.type = 'elevator_pass'
JOIN occupants o ON ka.occupant_id = o.id
ORDER BY ka.assigned_at DESC;

-- Update functions with proper search_path
CREATE OR REPLACE FUNCTION detect_overdue_assignments(days_threshold INTEGER DEFAULT 30)
RETURNS TABLE(assignment_id UUID, key_id UUID, occupant_id UUID, days_overdue INTEGER) 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ka.id as assignment_id,
    ka.key_id,
    ka.occupant_id,
    EXTRACT(days FROM (NOW() - ka.assigned_at))::INTEGER as days_overdue
  FROM key_assignments ka
  JOIN keys k ON ka.key_id = k.id
  WHERE ka.status IN ('assigned', 'active')
    AND k.type = 'elevator_pass'
    AND ka.assigned_at + INTERVAL '1 day' * days_threshold < NOW();
END;
$$;

CREATE OR REPLACE FUNCTION bulk_update_assignment_status(
  assignment_ids UUID[],
  new_status TEXT,
  return_reason TEXT DEFAULT NULL
)
RETURNS INTEGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- Validate status
  IF new_status NOT IN ('issued', 'assigned', 'active', 'returned', 'overdue', 'lost') THEN
    RAISE EXCEPTION 'Invalid status: %', new_status;
  END IF;
  
  -- Update assignments
  UPDATE key_assignments 
  SET 
    status = new_status,
    returned_at = CASE WHEN new_status = 'returned' THEN NOW() ELSE returned_at END,
    return_reason = CASE WHEN new_status = 'returned' THEN COALESCE(return_reason, 'Bulk return') ELSE return_reason END,
    updated_at = NOW()
  WHERE id = ANY(assignment_ids);
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;