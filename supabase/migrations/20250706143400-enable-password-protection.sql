-- Enable leaked password protection for enhanced security
-- This addresses the "Leaked Password Protection Disabled" warning

-- Note: This migration requires superuser privileges to execute
-- If running locally with supabase CLI, this should work automatically
-- If running on Supabase Cloud, you may need to contact support to apply this change

BEGIN;

-- Enable leaked password protection in Auth settings
-- This checks passwords against HaveIBeenPwned.org to prevent use of compromised passwords
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
