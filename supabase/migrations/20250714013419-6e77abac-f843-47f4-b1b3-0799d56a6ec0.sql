-- Add sort_order column to court_assignments table
ALTER TABLE court_assignments 
ADD COLUMN sort_order INTEGER DEFAULT 0;

-- Create index for better performance
CREATE INDEX idx_court_assignments_sort_order ON court_assignments(sort_order);

-- Update existing rows with default sort order using a subquery
WITH ordered_assignments AS (
  SELECT id, row_number() OVER (ORDER BY part NULLS LAST, room_number) as new_order
  FROM court_assignments
)
UPDATE court_assignments 
SET sort_order = ordered_assignments.new_order
FROM ordered_assignments
WHERE court_assignments.id = ordered_assignments.id;