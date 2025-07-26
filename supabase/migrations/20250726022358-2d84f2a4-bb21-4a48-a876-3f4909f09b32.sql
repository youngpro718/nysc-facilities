-- Emergency Recovery Migration - Part 2: Remove all validation triggers
-- Drop all triggers that depend on validate_text_input function

DROP TRIGGER IF EXISTS validate_supply_requests_input ON public.supply_requests;
DROP TRIGGER IF EXISTS validate_key_requests_input ON public.key_requests;
DROP TRIGGER IF EXISTS validate_issues_input ON public.issues;
DROP TRIGGER IF EXISTS validate_text_input_trigger ON public.court_rooms;
DROP TRIGGER IF EXISTS validate_text_input_trigger ON public.profiles;

-- Now drop the function
DROP FUNCTION IF EXISTS public.validate_text_input() CASCADE;

-- Fix RLS recursion on user_roles
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

CREATE POLICY "Users can view their own role" 
ON public.user_roles 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can manage roles" 
ON public.user_roles 
FOR ALL 
USING (auth.uid() IS NOT NULL) 
WITH CHECK (auth.uid() IS NOT NULL);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create the missing database objects
CREATE OR REPLACE VIEW public.courtroom_availability AS
SELECT 
  cr.id,
  cr.room_number,
  cr.courtroom_number,
  cr.is_active,
  cr.maintenance_status,
  cr.spectator_capacity,
  cr.juror_capacity,
  cr.accessibility_features,
  cr.notes,
  CASE 
    WHEN cr.maintenance_status = 'under_maintenance' THEN 'unavailable'
    WHEN cr.is_active = false THEN 'inactive'
    ELSE 'available'
  END as availability_status
FROM public.court_rooms cr;

CREATE OR REPLACE VIEW public.court_maintenance_view AS
SELECT 
  cr.id as court_id,
  cr.room_number,
  cr.maintenance_status,
  cr.maintenance_start_date,
  cr.maintenance_end_date,
  cr.maintenance_notes,
  ms.id as schedule_id,
  ms.title as maintenance_title,
  ms.scheduled_start_date,
  ms.scheduled_end_date,
  ms.status as schedule_status
FROM public.court_rooms cr
LEFT JOIN public.maintenance_schedules ms ON ms.space_name = cr.room_number;

-- Create maintenance_requests table
CREATE TABLE IF NOT EXISTS public.maintenance_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  priority text DEFAULT 'medium',
  status text DEFAULT 'pending',
  requested_by uuid REFERENCES auth.users(id),
  assigned_to uuid REFERENCES auth.users(id),
  space_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access maintenance requests" 
ON public.maintenance_requests 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Add missing columns to key_orders
ALTER TABLE public.key_orders 
ADD COLUMN IF NOT EXISTS key_name text,
ADD COLUMN IF NOT EXISTS key_type text,
ADD COLUMN IF NOT EXISTS recipient_name text,
ADD COLUMN IF NOT EXISTS recipient_department text;

-- Add missing columns to issues
ALTER TABLE public.issues 
ADD COLUMN IF NOT EXISTS resolved_at timestamptz;

-- Create emergency admin function
CREATE OR REPLACE FUNCTION public.create_emergency_admin(user_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_id uuid;
BEGIN
  SELECT id INTO user_id FROM auth.users WHERE email = user_email;
  
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;
  
  DELETE FROM public.user_roles WHERE user_id = user_id;
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  UPDATE public.profiles 
  SET 
    access_level = 'admin',
    is_approved = true,
    verification_status = 'verified'
  WHERE id = user_id;
END;
$$;