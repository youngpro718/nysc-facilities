-- Fix RLS policy issues identified by Supabase linter
-- This migration enables RLS on tables that have policies but RLS disabled
-- while ensuring proper access for authenticated users and admins

BEGIN;

-- =============================================
-- Enable RLS on tables with existing policies
-- =============================================

-- Buildings table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'buildings' AND schemaname = 'public') THEN
        ALTER TABLE public.buildings ENABLE ROW LEVEL SECURITY;
        
        -- Ensure admin policy exists
        DROP POLICY IF EXISTS "Allow admin full access" ON public.buildings;
        CREATE POLICY "Allow admin full access" 
        ON public.buildings 
        TO authenticated 
        USING (
            EXISTS (
                SELECT 1 FROM public.user_roles 
                WHERE user_id = auth.uid() 
                AND role = 'admin'
            )
        )
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM public.user_roles 
                WHERE user_id = auth.uid() 
                AND role = 'admin'
            )
        );
        
        -- Ensure read access for authenticated users
        DROP POLICY IF EXISTS "Allow authenticated read access" ON public.buildings;
        CREATE POLICY "Allow authenticated read access" 
        ON public.buildings 
        FOR SELECT 
        TO authenticated 
        USING (true);
    END IF;
END $$;

-- Floors table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'floors' AND schemaname = 'public') THEN
        ALTER TABLE public.floors ENABLE ROW LEVEL SECURITY;
        
        -- Ensure admin policy exists
        DROP POLICY IF EXISTS "Allow admin full access" ON public.floors;
        CREATE POLICY "Allow admin full access" 
        ON public.floors 
        TO authenticated 
        USING (
            EXISTS (
                SELECT 1 FROM public.user_roles 
                WHERE user_id = auth.uid() 
                AND role = 'admin'
            )
        )
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM public.user_roles 
                WHERE user_id = auth.uid() 
                AND role = 'admin'
            )
        );
        
        -- Ensure read access for authenticated users
        DROP POLICY IF EXISTS "Allow authenticated read access" ON public.floors;
        CREATE POLICY "Allow authenticated read access" 
        ON public.floors 
        FOR SELECT 
        TO authenticated 
        USING (true);
    END IF;
END $$;

-- Rooms table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'rooms' AND schemaname = 'public') THEN
        ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
        
        -- Ensure admin policy exists
        DROP POLICY IF EXISTS "Allow admin full access" ON public.rooms;
        CREATE POLICY "Allow admin full access" 
        ON public.rooms 
        TO authenticated 
        USING (
            EXISTS (
                SELECT 1 FROM public.user_roles 
                WHERE user_id = auth.uid() 
                AND role = 'admin'
            )
        )
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM public.user_roles 
                WHERE user_id = auth.uid() 
                AND role = 'admin'
            )
        );
        
        -- Ensure read access for authenticated users
        DROP POLICY IF EXISTS "Allow authenticated read access" ON public.rooms;
        CREATE POLICY "Allow authenticated read access" 
        ON public.rooms 
        FOR SELECT 
        TO authenticated 
        USING (true);
    END IF;
END $$;

-- Hallways table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'hallways' AND schemaname = 'public') THEN
        ALTER TABLE public.hallways ENABLE ROW LEVEL SECURITY;
        
        -- Ensure admin policy exists
        DROP POLICY IF EXISTS "Allow admin full access" ON public.hallways;
        CREATE POLICY "Allow admin full access" 
        ON public.hallways 
        TO authenticated 
        USING (
            EXISTS (
                SELECT 1 FROM public.user_roles 
                WHERE user_id = auth.uid() 
                AND role = 'admin'
            )
        )
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM public.user_roles 
                WHERE user_id = auth.uid() 
                AND role = 'admin'
            )
        );
        
        -- Ensure read access for authenticated users
        DROP POLICY IF EXISTS "Allow authenticated read access" ON public.hallways;
        CREATE POLICY "Allow authenticated read access" 
        ON public.hallways 
        FOR SELECT 
        TO authenticated 
        USING (true);
    END IF;
END $$;

-- Doors table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'doors' AND schemaname = 'public') THEN
        ALTER TABLE public.doors ENABLE ROW LEVEL SECURITY;
        
        -- Ensure admin policy exists
        DROP POLICY IF EXISTS "Allow admin full access" ON public.doors;
        CREATE POLICY "Allow admin full access" 
        ON public.doors 
        TO authenticated 
        USING (
            EXISTS (
                SELECT 1 FROM public.user_roles 
                WHERE user_id = auth.uid() 
                AND role = 'admin'
            )
        )
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM public.user_roles 
                WHERE user_id = auth.uid() 
                AND role = 'admin'
            )
        );
        
        -- Ensure read access for authenticated users
        DROP POLICY IF EXISTS "Allow authenticated read access" ON public.doors;
        CREATE POLICY "Allow authenticated read access" 
        ON public.doors 
        FOR SELECT 
        TO authenticated 
        USING (true);
    END IF;
END $$;

-- Profiles table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'profiles' AND schemaname = 'public') THEN
        ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
        
        -- Ensure admin policy exists
        DROP POLICY IF EXISTS "Enable all access for admins" ON public.profiles;
        CREATE POLICY "Enable all access for admins" 
        ON public.profiles 
        TO authenticated 
        USING (
            EXISTS (
                SELECT 1 FROM public.user_roles 
                WHERE user_id = auth.uid() 
                AND role = 'admin'
            )
        )
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM public.user_roles 
                WHERE user_id = auth.uid() 
                AND role = 'admin'
            )
        );
        
        -- Ensure users can view their own profile
        DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
        CREATE POLICY "Users can view their own profile" 
        ON public.profiles 
        FOR SELECT 
        TO authenticated 
        USING (id = auth.uid());
        
        -- Ensure users can update their own profile
        DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
        CREATE POLICY "Users can update their own profile" 
        ON public.profiles 
        FOR UPDATE 
        TO authenticated 
        USING (id = auth.uid())
        WITH CHECK (id = auth.uid());
    END IF;
END $$;

-- User roles table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_roles' AND schemaname = 'public') THEN
        ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
        
        -- Ensure admin policy exists
        DROP POLICY IF EXISTS "Allow admin full access" ON public.user_roles;
        CREATE POLICY "Allow admin full access" 
        ON public.user_roles 
        TO authenticated 
        USING (
            EXISTS (
                SELECT 1 FROM public.user_roles 
                WHERE user_id = auth.uid() 
                AND role = 'admin'
            )
        )
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM public.user_roles 
                WHERE user_id = auth.uid() 
                AND role = 'admin'
            )
        );
        
        -- Ensure users can see their own roles
        DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
        CREATE POLICY "Users can view their own role" 
        ON public.user_roles 
        FOR SELECT 
        TO authenticated 
        USING (user_id = auth.uid());
    END IF;
END $$;

-- Room properties table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'room_properties' AND schemaname = 'public') THEN
        ALTER TABLE public.room_properties ENABLE ROW LEVEL SECURITY;
        
        -- Ensure admin policy exists
        DROP POLICY IF EXISTS "Allow admin full access" ON public.room_properties;
        CREATE POLICY "Allow admin full access" 
        ON public.room_properties 
        TO authenticated 
        USING (
            EXISTS (
                SELECT 1 FROM public.user_roles 
                WHERE user_id = auth.uid() 
                AND role = 'admin'
            )
        )
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM public.user_roles 
                WHERE user_id = auth.uid() 
                AND role = 'admin'
            )
        );
        
        -- Ensure read access for authenticated users
        DROP POLICY IF EXISTS "Allow authenticated read access" ON public.room_properties;
        CREATE POLICY "Allow authenticated read access" 
        ON public.room_properties 
        FOR SELECT 
        TO authenticated 
        USING (true);
    END IF;
END $$;

-- Space connections table (needed for navigation)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'space_connections' AND schemaname = 'public') THEN
        ALTER TABLE public.space_connections ENABLE ROW LEVEL SECURITY;
        
        -- Ensure admin policy exists
        DROP POLICY IF EXISTS "Allow admin full access" ON public.space_connections;
        CREATE POLICY "Allow admin full access" 
        ON public.space_connections 
        TO authenticated 
        USING (
            EXISTS (
                SELECT 1 FROM public.user_roles 
                WHERE user_id = auth.uid() 
                AND role = 'admin'
            )
        )
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM public.user_roles 
                WHERE user_id = auth.uid() 
                AND role = 'admin'
            )
        );
        
        -- Ensure read access for authenticated users
        DROP POLICY IF EXISTS "Allow authenticated read access" ON public.space_connections;
        CREATE POLICY "Allow authenticated read access" 
        ON public.space_connections 
        FOR SELECT 
        TO authenticated 
        USING (true);
    END IF;
END $$;

COMMIT;
