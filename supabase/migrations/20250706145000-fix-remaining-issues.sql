-- Fix remaining security issues: function search paths and leaked password protection
-- This is a comprehensive migration that handles both issues in one file

BEGIN;

-- =============================================
-- 1. Fix function search paths for all functions in public schema
-- =============================================

-- Create a helper function to set search_path for all functions in public schema
CREATE OR REPLACE FUNCTION temp_fix_function_search_paths()
RETURNS void AS $$
DECLARE
    func_record RECORD;
BEGIN
    -- Loop through all functions in public schema
    FOR func_record IN 
        SELECT 
            n.nspname AS schema_name,
            p.proname AS function_name,
            pg_get_function_identity_arguments(p.oid) AS function_args
        FROM 
            pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE 
            n.nspname = 'public'
    LOOP
        -- Alter function to set search_path explicitly
        BEGIN
            EXECUTE format(
                'ALTER FUNCTION public.%I(%s) SET search_path = ''public'';',
                func_record.function_name,
                func_record.function_args
            );
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not alter function %(%): %', 
                func_record.function_name, 
                func_record.function_args, 
                SQLERRM;
        END;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the helper function
SELECT temp_fix_function_search_paths();

-- Drop the helper function when done
DROP FUNCTION temp_fix_function_search_paths();

-- =============================================
-- 2. Enable leaked password protection in Auth settings
-- =============================================

DO $$
BEGIN
    -- Check if we're running on a platform where we can modify auth settings
    IF EXISTS (
        SELECT 1 
        FROM pg_tables 
        WHERE tablename = 'config' 
        AND schemaname = 'auth'
    ) THEN
        -- Update the auth.config table to enable leaked password protection
        UPDATE auth.config 
        SET enable_leaked_password_protection = true;
    END IF;
END $$;

COMMIT;
