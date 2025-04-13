-- Add date columns to term_assignments table
ALTER TABLE term_assignments ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ;
ALTER TABLE term_assignments ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ;

-- Add comments to explain the columns' purposes
COMMENT ON COLUMN term_assignments.start_date IS 'The start date for this term assignment';
COMMENT ON COLUMN term_assignments.end_date IS 'The end date for this term assignment'; 