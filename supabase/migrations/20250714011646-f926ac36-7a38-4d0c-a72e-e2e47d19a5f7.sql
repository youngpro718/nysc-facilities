-- Allow null values for justice and part fields during creation
ALTER TABLE court_assignments 
ALTER COLUMN justice DROP NOT NULL,
ALTER COLUMN part DROP NOT NULL;