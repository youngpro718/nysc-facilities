-- Fix function search path warnings by setting explicit search paths
-- This addresses the "function_search_path_mutable" warnings from the Supabase linter

BEGIN;

-- =============================================
-- Set explicit search paths for all functions to prevent search_path injection attacks
-- =============================================

-- Helper function to alter function search paths
CREATE OR REPLACE FUNCTION temp_set_search_path()
RETURNS void AS $$
DECLARE
    func_record RECORD;
BEGIN
    -- Loop through all functions in public schema
    FOR func_record IN 
        SELECT 
            p.proname AS function_name,
            pg_get_function_identity_arguments(p.oid) AS args
        FROM 
            pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE 
            n.nspname = 'public'
            AND p.prosecdef = false  -- Not SECURITY DEFINER
    LOOP
        -- Skip this helper function
        IF func_record.function_name = 'temp_set_search_path' THEN
            CONTINUE;
        END IF;
        
        -- Construct and execute ALTER FUNCTION statement
        BEGIN
            EXECUTE format(
                'ALTER FUNCTION public.%I(%s) SET search_path = ''public'';',
                func_record.function_name,
                func_record.args
            );
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not alter function %.%(%): %', 
                'public', 
                func_record.function_name, 
                func_record.args,
                SQLERRM;
        END;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the helper function
SELECT temp_set_search_path();

-- Drop the helper function when done
DROP FUNCTION temp_set_search_path();

COMMIT;
