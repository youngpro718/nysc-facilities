-- Remove unauthorized personnel names from existing court assignments
-- These names should not be in the system and need to be cleaned up

-- Remove unauthorized clerks from the clerks array
UPDATE court_assignments 
SET clerks = ARRAY(
  SELECT unnest(clerks) 
  WHERE unnest(clerks) NOT IN (
    'CHRISTOPHER DISANTO ESQ', 
    'LISABETTA GARCIA'
  )
)
WHERE clerks IS NOT NULL 
  AND array_length(clerks, 1) > 0
  AND (
    'CHRISTOPHER DISANTO ESQ' = ANY(clerks) OR 
    'LISABETTA GARCIA' = ANY(clerks)
  );

-- Clean up any empty arrays that might result
UPDATE court_assignments 
SET clerks = NULL 
WHERE clerks IS NOT NULL 
  AND array_length(clerks, 1) = 0;

-- Also remove these names from justice field if they appear there
UPDATE court_assignments 
SET justice = NULL 
WHERE justice IN ('CHRISTOPHER DISANTO ESQ', 'LISABETTA GARCIA');

-- And from sergeant field if they appear there
UPDATE court_assignments 
SET sergeant = NULL 
WHERE sergeant IN ('CHRISTOPHER DISANTO ESQ', 'LISABETTA GARCIA');
