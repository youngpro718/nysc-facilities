-- Emergency Recovery Migration
-- Phase 1: Fix RLS Recursion and restore admin access

-- First, temporarily disable RLS on user_roles to break the recursion
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- Drop the problematic RLS policies that cause recursion
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Create safe RLS policies without recursion
CREATE POLICY "Users can view their own role" 
ON public.user_roles 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can insert roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update roles" 
ON public.user_roles 
FOR UPDATE 
USING (true);

-- Re-enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Phase 2: Restore missing database views and tables

-- Recreate courtroom_availability view
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

-- Recreate court_maintenance_view
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

-- Create maintenance_requests table if it doesn't exist
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

-- Enable RLS on maintenance_requests
ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for maintenance_requests
CREATE POLICY "Users can view maintenance requests" 
ON public.maintenance_requests 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create maintenance requests" 
ON public.maintenance_requests 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update maintenance requests" 
ON public.maintenance_requests 
FOR UPDATE 
USING (true);

-- Phase 3: Fix KeyOrder table - add missing columns
ALTER TABLE public.key_orders 
ADD COLUMN IF NOT EXISTS key_name text,
ADD COLUMN IF NOT EXISTS key_type text,
ADD COLUMN IF NOT EXISTS recipient_name text,
ADD COLUMN IF NOT EXISTS recipient_department text;

-- Update key_orders with data from related tables
UPDATE public.key_orders ko
SET 
  key_name = k.name,
  key_type = k.type::text
FROM public.keys k
WHERE ko.key_id = k.id AND ko.key_name IS NULL;

-- Update recipient info from profiles
UPDATE public.key_orders ko
SET 
  recipient_name = COALESCE(p.first_name || ' ' || p.last_name, p.email),
  recipient_department = p.department
FROM public.profiles p
WHERE ko.user_id = p.id AND ko.recipient_name IS NULL;

-- Phase 4: Create emergency admin user function
CREATE OR REPLACE FUNCTION public.create_emergency_admin(user_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_id uuid;
BEGIN
  -- Get user ID from email
  SELECT id INTO user_id FROM auth.users WHERE email = user_email;
  
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;
  
  -- Remove existing roles for this user
  DELETE FROM public.user_roles WHERE user_id = user_id;
  
  -- Add admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Update profile to admin access level
  UPDATE public.profiles 
  SET 
    access_level = 'admin',
    is_approved = true,
    verification_status = 'verified'
  WHERE id = user_id;
END;
$$;

-- Phase 5: Fix issues table - add missing columns
ALTER TABLE public.issues 
ADD COLUMN IF NOT EXISTS resolved_at timestamptz;

-- Update resolved_at for resolved issues
UPDATE public.issues 
SET resolved_at = updated_at 
WHERE status = 'resolved' AND resolved_at IS NULL;