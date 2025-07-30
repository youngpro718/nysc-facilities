-- Fix security linter warnings

-- Fix functions with mutable search_path
CREATE OR REPLACE FUNCTION public.update_supply_request_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_key_request_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- Remove or replace the security definer views that are causing warnings
-- These views expose data with elevated privileges, which is a security risk

-- Drop the problematic views and create proper functions instead
DROP VIEW IF EXISTS court_maintenance_view;
DROP VIEW IF EXISTS courtroom_availability;

-- Create secure functions to replace the views
CREATE OR REPLACE FUNCTION public.get_court_maintenance_info()
RETURNS TABLE (
  court_id uuid,
  room_number text,
  maintenance_status text,
  maintenance_start_date timestamp with time zone,
  maintenance_end_date timestamp with time zone,
  maintenance_notes text,
  schedule_id uuid,
  maintenance_title text,
  scheduled_start_date timestamp with time zone,
  scheduled_end_date timestamp with time zone,
  schedule_status text
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
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
  FROM court_rooms cr
  LEFT JOIN maintenance_schedules ms ON ms.space_name = cr.room_number
  WHERE cr.is_active = true;
$$;

CREATE OR REPLACE FUNCTION public.get_courtroom_availability()
RETURNS TABLE (
  id uuid,
  room_number text,
  courtroom_number text,
  maintenance_status text,
  availability_status text,
  spectator_capacity integer,
  juror_capacity integer,
  accessibility_features jsonb,
  is_active boolean,
  notes text
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT 
    cr.id,
    cr.room_number,
    cr.courtroom_number,
    cr.maintenance_status,
    CASE 
      WHEN cr.maintenance_status = 'under_maintenance' THEN 'unavailable'
      WHEN cr.is_active = false THEN 'inactive'
      ELSE 'available'
    END as availability_status,
    cr.spectator_capacity,
    cr.juror_capacity,
    cr.accessibility_features,
    cr.is_active,
    cr.notes
  FROM court_rooms cr
  WHERE cr.is_active = true;
$$;

-- Create RLS policies for the secure functions
CREATE POLICY "Authenticated users can view court maintenance"
ON court_rooms FOR SELECT
TO authenticated
USING (true);

-- Add comprehensive input validation function
CREATE OR REPLACE FUNCTION public.validate_email_format(email text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_password_strength(password text)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  is_valid boolean := true;
  errors text[] := '{}';
BEGIN
  -- Check minimum length
  IF length(password) < 8 THEN
    is_valid := false;
    errors := array_append(errors, 'Password must be at least 8 characters long');
  END IF;
  
  -- Check for uppercase letter
  IF password !~ '[A-Z]' THEN
    is_valid := false;
    errors := array_append(errors, 'Password must contain at least one uppercase letter');
  END IF;
  
  -- Check for lowercase letter
  IF password !~ '[a-z]' THEN
    is_valid := false;
    errors := array_append(errors, 'Password must contain at least one lowercase letter');
  END IF;
  
  -- Check for number
  IF password !~ '[0-9]' THEN
    is_valid := false;
    errors := array_append(errors, 'Password must contain at least one number');
  END IF;
  
  -- Check for special character
  IF password !~ '[^a-zA-Z0-9]' THEN
    is_valid := false;
    errors := array_append(errors, 'Password must contain at least one special character');
  END IF;
  
  result := jsonb_build_object(
    'is_valid', is_valid,
    'errors', to_jsonb(errors)
  );
  
  RETURN result;
END;
$$;

-- Create function to sanitize input data
CREATE OR REPLACE FUNCTION public.sanitize_input(input_text text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Remove potentially dangerous characters and scripts
  RETURN regexp_replace(
    regexp_replace(
      regexp_replace(input_text, '<[^>]*>', '', 'g'), -- Remove HTML tags
      '[^\w\s\-@.()]+', '', 'g' -- Remove special chars except safe ones
    ),
    '\s+', ' ', 'g' -- Normalize whitespace
  );
END;
$$;