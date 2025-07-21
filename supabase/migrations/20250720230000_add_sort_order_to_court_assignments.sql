-- Add sort_order column to court_assignments table for drag and drop functionality

-- Add sort_order column
ALTER TABLE court_assignments 
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Create index for better performance when ordering
CREATE INDEX IF NOT EXISTS idx_court_assignments_sort_order 
ON court_assignments(sort_order);

-- Update existing records to have sequential sort_order based on room_number
UPDATE court_assignments 
SET sort_order = subquery.row_num - 1
FROM (
  SELECT 
    ca.id,
    ROW_NUMBER() OVER (ORDER BY cr.room_number) as row_num
  FROM court_assignments ca
  JOIN court_rooms cr ON ca.room_id = cr.room_id
  WHERE ca.sort_order = 0 OR ca.sort_order IS NULL
) as subquery
WHERE court_assignments.id = subquery.id;

-- Add comment to document the purpose
COMMENT ON COLUMN court_assignments.sort_order IS 'Used for drag and drop ordering of courtroom assignments in the UI';
