-- Disable RLS on critical tables to restore dashboard functionality
-- This follows the original approach from the first migration

BEGIN;

-- =============================================
-- Directly disable RLS on critical tables needed for dashboard functionality
-- This matches the original approach from 20250706130200-fix-security-issues.sql
-- =============================================

-- Critical tables for authentication
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_roles DISABLE ROW LEVEL SECURITY;

-- Critical tables for dashboard functionality
ALTER TABLE IF EXISTS public.buildings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.floors DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.rooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hallways DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.doors DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.room_properties DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.space_connections DISABLE ROW LEVEL SECURITY;

-- =============================================
-- Clean up any conflicting policies on these tables
-- =============================================

DO $$
DECLARE
    table_name TEXT;
BEGIN
    -- List of critical tables
    FOR table_name IN 
        SELECT unnest(ARRAY[
            'profiles', 'user_roles', 'buildings', 'floors', 'rooms', 
            'hallways', 'doors', 'room_properties', 'space_connections'
        ])
    LOOP
        -- Drop all policies on this table
        EXECUTE format('
            DO $inner$
            DECLARE
                policy_name TEXT;
            BEGIN
                FOR policy_name IN 
                    SELECT policyname 
                    FROM pg_policies 
                    WHERE tablename = %L AND schemaname = ''public''
                LOOP
                    EXECUTE format(''DROP POLICY IF EXISTS %%I ON public.%s'', policy_name);
                END LOOP;
            END $inner$;
        ', table_name, table_name);
    END LOOP;
END $$;

COMMIT;
