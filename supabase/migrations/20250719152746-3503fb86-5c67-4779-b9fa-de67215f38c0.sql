
-- Add missing columns to occupants table
ALTER TABLE public.occupants ADD COLUMN IF NOT EXISTS role public.court_role;
ALTER TABLE public.occupants ADD COLUMN IF NOT EXISTS court_position TEXT;

-- Update existing occupants with role mappings based on department
UPDATE public.occupants SET 
  role = CASE 
    WHEN department ILIKE '%judge%' THEN 'judge'::court_role
    WHEN department ILIKE '%clerk%' THEN 'clerk'::court_role  
    WHEN department ILIKE '%sergeant%' THEN 'sergeant'::court_role
    WHEN department ILIKE '%officer%' THEN 'court_officer'::court_role
    WHEN department ILIKE '%admin%' THEN 'admin'::court_role
    WHEN department ILIKE '%facilities%' THEN 'facilities_manager'::court_role
    WHEN department ILIKE '%aide%' THEN 'court_aide'::court_role
    WHEN department ILIKE '%bailiff%' THEN 'bailiff'::court_role
    WHEN department ILIKE '%reporter%' THEN 'court_reporter'::court_role
    WHEN department ILIKE '%assistant%' THEN 'administrative_assistant'::court_role
    ELSE 'clerk'::court_role -- default for unknown departments
  END
WHERE role IS NULL;

-- Set court_position based on existing title or department data
UPDATE public.occupants SET 
  court_position = COALESCE(title, department)
WHERE court_position IS NULL;
