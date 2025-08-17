-- Create/replace trigger to mirror auth.users into public.profiles and carry over user metadata
-- Includes requested_access_level captured at signup under raw_user_meta_data

BEGIN;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert a new profile row for this auth user, carrying over metadata
  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    metadata,
    verification_status,
    is_approved,
    access_level,
    created_at
  ) VALUES (
    NEW.id,
    NEW.email,
    NULLIF(NEW.raw_user_meta_data->>'first_name', '')::text,
    NULLIF(NEW.raw_user_meta_data->>'last_name', '')::text,
    COALESCE(NEW.raw_user_meta_data::jsonb, '{}'::jsonb),
    'pending',
    false,
    'none',
    now()
  )
  ON CONFLICT (id) DO UPDATE
    SET metadata = COALESCE(public.profiles.metadata, '{}'::jsonb) || EXCLUDED.metadata;

  RETURN NEW;
END;
$$;

-- Recreate trigger to ensure it points to the latest function body
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

COMMIT;
