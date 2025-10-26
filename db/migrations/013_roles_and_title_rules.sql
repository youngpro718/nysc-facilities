-- Migration: Roles Catalog and Title Access Rules
-- Date: 2025-10-26
-- Purpose: Create roles catalog and enhance title-to-role mapping system

-- Create roles catalog table
CREATE TABLE IF NOT EXISTS public.roles_catalog (
  role TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert all available roles
INSERT INTO public.roles_catalog(role, description) VALUES
  ('admin', 'Full system administrator'),
  ('cmc', 'Court Management Coordinator - Court operations'),
  ('court_aide', 'Court Aide - Supply orders, room, inventory'),
  ('purchasing_staff', 'Purchasing/Procurement - View inventory and supply room'),
  ('facilities_manager', 'Facility Coordinator - Building management'),
  ('supply_room_staff', 'Supply Room Staff - Legacy role'),
  ('clerk', 'Court Manager - Court operations'),
  ('sergeant', 'Operations supervisor'),
  ('judge', 'Judge'),
  ('court_officer', 'Court Officer'),
  ('bailiff', 'Bailiff'),
  ('court_reporter', 'Court Reporter'),
  ('administrative_assistant', 'Administrative Assistant'),
  ('standard', 'Standard User - Basic access'),
  ('coordinator', 'Administrator - Legacy role'),
  ('it_dcas', 'IT/Systems - Legacy role'),
  ('viewer', 'Read-only - Legacy role')
ON CONFLICT (role) DO NOTHING;

-- Create or update title_access_rules table
CREATE TABLE IF NOT EXISTS public.title_access_rules (
  id BIGSERIAL PRIMARY KEY,
  job_title TEXT NOT NULL,
  role TEXT NOT NULL REFERENCES public.roles_catalog(role) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(job_title)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_title_access_rules_job_title ON public.title_access_rules(job_title);
CREATE INDEX IF NOT EXISTS idx_title_access_rules_role ON public.title_access_rules(role);

-- Enable RLS
ALTER TABLE public.roles_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.title_access_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for roles_catalog (read-only for all authenticated users)
CREATE POLICY roles_catalog_read ON public.roles_catalog
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- RLS Policies for title_access_rules
CREATE POLICY title_access_rules_read ON public.title_access_rules
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY title_access_rules_admin_all ON public.title_access_rules
  FOR ALL
  USING (
    EXISTS(
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'coordinator', 'it_dcas')
    )
  );

-- Function to get role for a job title
CREATE OR REPLACE FUNCTION public.get_role_for_title(p_job_title TEXT)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role
  FROM public.title_access_rules
  WHERE LOWER(job_title) = LOWER(p_job_title)
  LIMIT 1;
  
  RETURN COALESCE(v_role, 'standard');
END;
$$;

COMMENT ON FUNCTION public.get_role_for_title(TEXT) IS 'Returns the role assigned to a job title, defaults to standard if not found';

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_role_for_title(TEXT) TO authenticated;

-- Add helpful comments
COMMENT ON TABLE public.roles_catalog IS 'Catalog of all available roles in the system';
COMMENT ON TABLE public.title_access_rules IS 'Mapping of job titles to roles for automatic role assignment';
COMMENT ON COLUMN public.title_access_rules.job_title IS 'Job title as entered by user during signup';
COMMENT ON COLUMN public.title_access_rules.role IS 'Role to assign when this job title is detected';
