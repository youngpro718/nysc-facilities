
-- Add captain's office tracking fields to the keys table
ALTER TABLE keys 
ADD COLUMN captain_office_copy boolean DEFAULT false,
ADD COLUMN captain_office_assigned_date timestamp with time zone,
ADD COLUMN captain_office_notes text;

-- Create index for efficient filtering
CREATE INDEX idx_keys_captain_office_copy ON keys(captain_office_copy);

-- Update the key_inventory_view to include captain's office fields
DROP VIEW IF EXISTS key_inventory_view;
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
  COALESCE(active_assignments.count, 0) as active_assignments,
  COALESCE(returned_assignments.count, 0) as returned_assignments,
  COALESCE(lost_assignments.count, 0) as lost_count,
  k.created_at,
  k.updated_at
FROM keys k
LEFT JOIN (
  SELECT key_id, COUNT(*) as count
  FROM key_assignments 
  WHERE returned_at IS NULL AND return_reason IS NULL
  GROUP BY key_id
) active_assignments ON k.id = active_assignments.key_id
LEFT JOIN (
  SELECT key_id, COUNT(*) as count
  FROM key_assignments 
  WHERE returned_at IS NOT NULL AND return_reason = 'normal_return'
  GROUP BY key_id
) returned_assignments ON k.id = returned_assignments.key_id
LEFT JOIN (
  SELECT key_id, COUNT(*) as count
  FROM key_assignments 
  WHERE return_reason = 'lost'
  GROUP BY key_id
) lost_assignments ON k.id = lost_assignments.key_id;
