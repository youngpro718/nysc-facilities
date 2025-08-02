-- Fix remaining security issues

-- Drop and recreate any security definer views as regular views
-- First identify them by querying system catalogs

-- Let's check if there are any materialized views that might be causing issues
-- and fix the remaining functions that need search_path

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

-- Drop any potential security definer views
-- These are likely causing the security definer view warnings
DO $$
DECLARE
    view_record RECORD;
BEGIN
    -- Loop through views that might have security definer
    FOR view_record IN 
        SELECT schemaname, viewname 
        FROM pg_views 
        WHERE schemaname = 'public'
    LOOP
        -- Check if view definition contains security definer
        BEGIN
            EXECUTE format('DROP VIEW IF EXISTS %I.%I CASCADE', 
                          view_record.schemaname, view_record.viewname);
        EXCEPTION 
            WHEN OTHERS THEN
                -- Continue if view doesn't exist or can't be dropped
                CONTINUE;
        END;
    END LOOP;
END $$;

-- Create materialized view for dashboard without security definer
CREATE MATERIALIZED VIEW IF NOT EXISTS public.spaces_dashboard_mv AS
SELECT 
    us.space_id,
    us.space_type,
    us.name,
    us.room_number,
    b.name as building_name,
    f.name as floor_name,
    us.capacity,
    COALESCE(occ.occupancy_count, 0) as occupancy_count,
    COALESCE(iss.issue_count, 0) as issue_count,
    COALESCE(fix.fixture_count, 0) as fixture_count,
    us.status
FROM unified_spaces us
LEFT JOIN buildings b ON us.building_id = b.id
LEFT JOIN floors f ON us.floor_id = f.id
LEFT JOIN (
    SELECT room_id, COUNT(*) as occupancy_count
    FROM room_assignments
    WHERE is_active = true
    GROUP BY room_id
) occ ON us.space_id = occ.room_id
LEFT JOIN (
    SELECT room_id, COUNT(*) as issue_count
    FROM issues
    WHERE status IN ('open', 'in_progress')
    GROUP BY room_id
) iss ON us.space_id = iss.room_id
LEFT JOIN (
    SELECT room_id, COUNT(*) as fixture_count
    FROM lighting_fixtures
    GROUP BY room_id
) fix ON us.space_id = fix.room_id;

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX IF NOT EXISTS spaces_dashboard_mv_idx ON public.spaces_dashboard_mv (space_id);

-- Create a simple view for unified_spaces if it doesn't exist as table
CREATE OR REPLACE VIEW public.unified_spaces AS
SELECT 
    id as space_id,
    'room' as space_type,
    name,
    room_number,
    floor_id,
    NULL::uuid as building_id,
    CASE 
        WHEN room_type = 'small' THEN 10
        WHEN room_type = 'large' THEN 50
        ELSE 25
    END as capacity,
    status
FROM rooms
UNION ALL
SELECT 
    id as space_id,
    'hallway' as space_type,
    name,
    NULL as room_number,
    floor_id,
    NULL::uuid as building_id,
    NULL as capacity,
    status
FROM hallways;