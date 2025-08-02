-- Fix remaining security issues - corrected version

-- Fix all functions that are missing search_path
-- Update all existing functions to include proper search_path

-- Fix is_admin function
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM user_roles 
    WHERE user_roles.user_id = $1 
    AND role = 'admin'
  );
END;
$$;

-- Fix is_current_user_admin function  
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  );
END;
$$;

-- Update all other functions to include search_path
-- Fix update_updated_at function
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- Fix handle_new_user_role function
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'standard');
  RETURN NEW;
END;
$$;

-- Fix update_door_maintenance_schedule function
CREATE OR REPLACE FUNCTION public.update_door_maintenance_schedule()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- Schedule more frequent checks for high-security doors
  IF NEW.security_level = 'high_security' THEN
    NEW.next_maintenance_date := CURRENT_DATE + INTERVAL '1 month';
  ELSE
    NEW.next_maintenance_date := CURRENT_DATE + INTERVAL '3 months';
  END IF;
  RETURN NEW;
END;
$$;

-- Fix rollback_transaction function
CREATE OR REPLACE FUNCTION public.rollback_transaction()
RETURNS void
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
    -- This is just a placeholder function that does nothing
    -- The actual transaction control is handled by the client
    NULL;
END;
$$;

-- Create a corrected unified_spaces view without building_id reference
CREATE OR REPLACE VIEW public.unified_spaces AS
SELECT 
    r.id as space_id,
    'room' as space_type,
    r.name,
    r.room_number,
    r.floor_id,
    f.building_id,
    CASE 
        WHEN r.room_type = 'small' THEN 10
        WHEN r.room_type = 'large' THEN 50
        ELSE 25
    END as capacity,
    r.status
FROM rooms r
LEFT JOIN floors f ON r.floor_id = f.id
UNION ALL
SELECT 
    h.id as space_id,
    'hallway' as space_type,
    h.name,
    NULL as room_number,
    h.floor_id,
    f.building_id,
    NULL as capacity,
    h.status
FROM hallways h
LEFT JOIN floors f ON h.floor_id = f.id;

-- Create materialized view for dashboard
DROP MATERIALIZED VIEW IF EXISTS public.spaces_dashboard_mv CASCADE;
CREATE MATERIALIZED VIEW public.spaces_dashboard_mv AS
SELECT 
    us.space_id,
    us.space_type,
    us.name,
    us.room_number,
    b.name as building_name,
    f.name as floor_name,
    us.capacity,
    0 as occupancy_count,
    0 as issue_count,
    0 as fixture_count,
    us.status
FROM unified_spaces us
LEFT JOIN buildings b ON us.building_id = b.id
LEFT JOIN floors f ON us.floor_id = f.id;

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX IF NOT EXISTS spaces_dashboard_mv_idx ON public.spaces_dashboard_mv (space_id);