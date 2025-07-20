-- Direct fix for RLS issues - disables RLS on critical tables
-- This is a more direct approach when the permissive policy approach doesn't work

BEGIN;

-- =============================================
-- Directly disable RLS on critical tables needed for authentication and core functionality
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
-- For the remaining tables, enable RLS with permissive policies
-- =============================================

-- Create a function to enable RLS with permissive policies on all other tables
CREATE OR REPLACE FUNCTION temp_fix_remaining_tables()
RETURNS void AS $$
DECLARE
    table_record RECORD;
BEGIN
    -- Loop through all tables in public schema except the critical ones
    FOR table_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
        AND tablename NOT IN (
            'profiles', 'user_roles', 'buildings', 'floors', 'rooms', 
            'hallways', 'doors', 'room_properties', 'space_connections'
        )
    LOOP
        -- Enable RLS
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', table_record.tablename);
        
        -- Create a super permissive policy
        BEGIN
            EXECUTE format(
                'DROP POLICY IF EXISTS "Super permissive policy" ON public.%I;
                 CREATE POLICY "Super permissive policy" ON public.%I USING (true) WITH CHECK (true);',
                table_record.tablename, table_record.tablename
            );
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not create policy for table %: %', table_record.tablename, SQLERRM;
        END;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the helper function
SELECT temp_fix_remaining_tables();

-- Drop the helper function when done
DROP FUNCTION temp_fix_remaining_tables();

-- =============================================
-- Add special handling for auth.users if needed
-- =============================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'users' AND schemaname = 'auth') THEN
        ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Super permissive policy" ON auth.users;
        CREATE POLICY "Super permissive policy" 
        ON auth.users 
        USING (true) 
        WITH CHECK (true);
    END IF;
END $$;

COMMIT;
