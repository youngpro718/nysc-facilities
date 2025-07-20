-- Direct fix for leaked password protection
-- This migration requires superuser privileges to execute

-- Note: This migration may need to be applied manually by a Supabase admin
-- if you're using Supabase Cloud, as it requires access to the auth schema

BEGIN;

-- Enable leaked password protection in Auth settings
DO $$
BEGIN
    -- Check if we're running on a platform where we can modify auth settings
    IF EXISTS (
        SELECT 1 
        FROM pg_tables 
        WHERE tablename = 'config' 
        AND schemaname = 'auth'
    ) THEN
        -- Try direct update first
        BEGIN
            UPDATE auth.config 
            SET enable_leaked_password_protection = true;
        EXCEPTION WHEN insufficient_privilege THEN
            -- If direct update fails due to permissions, raise a notice
            RAISE NOTICE 'Could not update auth.config due to insufficient privileges. This migration may need to be applied manually by a Supabase admin.';
        END;
    ELSE
        RAISE NOTICE 'auth.config table not found. This may be expected in local development environments.';
    END IF;
END $$;

COMMIT;
