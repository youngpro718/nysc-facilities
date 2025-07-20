-- Migration to fix CAPTCHA verification issues in Supabase Auth

BEGIN;

-- =============================================
-- Update auth.config to disable or reconfigure CAPTCHA
-- =============================================

-- First attempt: Try to disable CAPTCHA verification entirely
DO $$
BEGIN
    -- Check if the column exists and update it
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'auth' 
        AND table_name = 'config' 
        AND column_name = 'enable_captcha'
    ) THEN
        UPDATE auth.config 
        SET enable_captcha = false;
    END IF;
    
    -- Alternative approach if the column has a different name
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'auth' 
        AND table_name = 'config' 
        AND column_name = 'captcha_enabled'
    ) THEN
        UPDATE auth.config 
        SET captcha_enabled = false;
    END IF;
    
    -- Another possible column name
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'auth' 
        AND table_name = 'config' 
        AND column_name = 'captcha_protection_enabled'
    ) THEN
        UPDATE auth.config 
        SET captcha_protection_enabled = false;
    END IF;
END $$;

-- Second attempt: Reset CAPTCHA keys if disabling isn't possible
DO $$
BEGIN
    -- Check if these columns exist and update them
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'auth' 
        AND table_name = 'config' 
        AND column_name = 'captcha_secret'
    ) THEN
        -- Set to empty string to effectively disable
        UPDATE auth.config 
        SET captcha_secret = '';
    END IF;
    
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'auth' 
        AND table_name = 'config' 
        AND column_name = 'captcha_site_key'
    ) THEN
        -- Set to empty string to effectively disable
        UPDATE auth.config 
        SET captcha_site_key = '';
    END IF;
END $$;

-- Note: If this migration fails due to permission issues,
-- you'll need to manually disable CAPTCHA in the Supabase dashboard:
-- 1. Go to Authentication → Settings → Security
-- 2. Find the CAPTCHA section and disable it or update the keys

COMMIT;
