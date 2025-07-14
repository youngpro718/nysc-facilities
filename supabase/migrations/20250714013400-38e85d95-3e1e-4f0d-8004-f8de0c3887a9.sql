-- Add sort_order column to court_assignments table
ALTER TABLE court_assignments 
ADD COLUMN sort_order INTEGER DEFAULT 0;

-- Update existing rows with default sort order based on current order
UPDATE court_assignments 
SET sort_order = row_number() OVER (ORDER BY part NULLS LAST, room_number);

-- Create index for better performance
CREATE INDEX idx_court_assignments_sort_order ON court_assignments(sort_order);