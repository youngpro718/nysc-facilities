-- Fix profile access by ensuring proper RLS policies
-- This migration ensures that users can access and update their own profile data

BEGIN;

-- Make sure profiles table has RLS enabled but with proper policies
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'profiles' 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', policy_record.policyname);
    END LOOP;
END
$$;

-- Create policy for users to read their own profile
CREATE POLICY "Users can read their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Create policy for users to update their own profile
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Create policy for users to insert their own profile
CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Create policy for admins to read all profiles
CREATE POLICY "Admins can read all profiles" 
ON public.profiles 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    )
);

-- Create policy for admins to update all profiles
CREATE POLICY "Admins can update all profiles" 
ON public.profiles 
FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    )
);

-- Create policy for admins to insert profiles
CREATE POLICY "Admins can insert profiles" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    )
);

-- Create policy for admins to delete profiles
CREATE POLICY "Admins can delete profiles" 
ON public.profiles 
FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    )
);

-- Make sure notification_preferences column exists in profiles table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'notification_preferences'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN notification_preferences JSONB DEFAULT '{
            "email": {
                "issues": true,
                "maintenance": true,
                "system_updates": true
            },
            "push": {
                "issues": true,
                "maintenance": true,
                "system_updates": true
            },
            "alert_preferences": {
                "priority_threshold": "high",
                "maintenance_reminders": true,
                "system_updates": true
            }
        }'::jsonb;
    END IF;
END
$$;

COMMIT;
