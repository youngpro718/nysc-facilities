-- Create database functions to safely access profile data
-- This migration adds RPC functions that can be used to access profile data safely

BEGIN;

-- Function to get a user's profile by ID
CREATE OR REPLACE FUNCTION public.get_user_profile(user_id UUID)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_record profiles;
  requesting_user_id UUID;
  is_admin BOOLEAN;
BEGIN
  -- Get the ID of the requesting user
  requesting_user_id := auth.uid();
  
  -- Check if the requesting user is an admin
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = requesting_user_id 
    AND role = 'admin'
  ) INTO is_admin;
  
  -- If the user is requesting their own profile or is an admin, return the profile
  IF requesting_user_id = user_id OR is_admin THEN
    SELECT * FROM profiles WHERE id = user_id INTO profile_record;
    RETURN profile_record;
  ELSE
    -- Otherwise, raise an exception
    RAISE EXCEPTION 'Not authorized to access this profile';
  END IF;
END;
$$;

-- Function to update a user's profile
CREATE OR REPLACE FUNCTION public.update_user_profile(
  user_id UUID,
  profile_data JSONB
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_record profiles;
  requesting_user_id UUID;
  is_admin BOOLEAN;
BEGIN
  -- Get the ID of the requesting user
  requesting_user_id := auth.uid();
  
  -- Check if the requesting user is an admin
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = requesting_user_id 
    AND role = 'admin'
  ) INTO is_admin;
  
  -- If the user is updating their own profile or is an admin, update the profile
  IF requesting_user_id = user_id OR is_admin THEN
    UPDATE profiles
    SET 
      first_name = COALESCE(profile_data->>'first_name', first_name),
      last_name = COALESCE(profile_data->>'last_name', last_name),
      username = COALESCE(profile_data->>'username', username),
      phone = COALESCE(profile_data->>'phone', phone),
      department = COALESCE(profile_data->>'department', department),
      title = COALESCE(profile_data->>'title', title),
      bio = COALESCE(profile_data->>'bio', bio),
      time_zone = COALESCE(profile_data->>'time_zone', time_zone),
      language = COALESCE(profile_data->>'language', language),
      emergency_contact = COALESCE(profile_data->'emergency_contact', emergency_contact),
      updated_at = NOW()
    WHERE id = user_id
    RETURNING * INTO profile_record;
    
    RETURN profile_record;
  ELSE
    -- Otherwise, raise an exception
    RAISE EXCEPTION 'Not authorized to update this profile';
  END IF;
END;
$$;

COMMIT;
