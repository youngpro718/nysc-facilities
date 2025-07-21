-- Clean up personnel profiles by removing entries that are not on the official list
-- This migration removes any personnel that shouldn't be in the system

-- First, let's see what we have
-- DELETE FROM personnel_profiles WHERE name NOT IN (
--   -- Official Judges from court assignment documents
--   'M. LEWIS', 'S. LITMAN', 'E. BIBEN', 'J. SVETKEY', 'S. STATSINGER', 
--   'A. THOMPSON', 'G. CARRO', 'M. MARTINEZ ALONSO', 'A. NEWBAUER',
--   
--   -- Official Clerks from court assignment documents  
--   'A. WRIGHT', 'A. SARMIENTO', 'T. GREENIDGE', 'C. WELDON', 'R. STEAKER', 
--   'T. CEDENO-BARRETT', 'J. ANDERSON', 'L. THOMAS', 'J. TAYLOR', 'R. WHITE', 
--   'M. MURPHY', 'Y. JIMENEZ-MOLINA',
--   
--   -- Official Sergeants from court assignment documents
--   'MADIGAN', 'SANTORE', 'DE TOMMASO', 'GONZALEZ', 'MCBRIEN', 'BONNY', 
--   'CASAZZA', 'HERNANDEZ', 'CALDWELL', 'CAPUTO'
-- );

-- For now, let's just mark unauthorized personnel as inactive instead of deleting
UPDATE personnel_profiles 
SET is_active = false, is_available_for_assignment = false
WHERE name NOT IN (
  -- Official Judges from court assignment documents
  'M. LEWIS', 'S. LITMAN', 'E. BIBEN', 'J. SVETKEY', 'S. STATSINGER', 
  'A. THOMPSON', 'G. CARRO', 'M. MARTINEZ ALONSO', 'A. NEWBAUER',
  
  -- Official Clerks from court assignment documents  
  'A. WRIGHT', 'A. SARMIENTO', 'T. GREENIDGE', 'C. WELDON', 'R. STEAKER', 
  'T. CEDENO-BARRETT', 'J. ANDERSON', 'L. THOMAS', 'J. TAYLOR', 'R. WHITE', 
  'M. MURPHY', 'Y. JIMENEZ-MOLINA',
  
  -- Official Sergeants from court assignment documents
  'MADIGAN', 'SANTORE', 'DE TOMMASO', 'GONZALEZ', 'MCBRIEN', 'BONNY', 
  'CASAZZA', 'HERNANDEZ', 'CALDWELL', 'CAPUTO'
);

-- Also clean up any existing court assignments that reference non-official personnel
UPDATE court_assignments 
SET justice = NULL 
WHERE justice NOT IN (
  'M. LEWIS', 'S. LITMAN', 'E. BIBEN', 'J. SVETKEY', 'S. STATSINGER', 
  'A. THOMPSON', 'G. CARRO', 'M. MARTINEZ ALONSO', 'A. NEWBAUER'
) AND justice IS NOT NULL;

UPDATE court_assignments 
SET sergeant = NULL 
WHERE sergeant NOT IN (
  'MADIGAN', 'SANTORE', 'DE TOMMASO', 'GONZALEZ', 'MCBRIEN', 'BONNY', 
  'CASAZZA', 'HERNANDEZ', 'CALDWELL', 'CAPUTO'
) AND sergeant IS NOT NULL;

-- Clean up clerks array - this is more complex since it's an array
UPDATE court_assignments 
SET clerks = ARRAY(
  SELECT unnest(clerks) 
  WHERE unnest(clerks) IN (
    'A. WRIGHT', 'A. SARMIENTO', 'T. GREENIDGE', 'C. WELDON', 'R. STEAKER', 
    'T. CEDENO-BARRETT', 'J. ANDERSON', 'L. THOMAS', 'J. TAYLOR', 'R. WHITE', 
    'M. MURPHY', 'Y. JIMENEZ-MOLINA'
  )
)
WHERE clerks IS NOT NULL AND array_length(clerks, 1) > 0;
