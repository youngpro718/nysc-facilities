-- Update the validation function to allow admins to bypass verification check
CREATE OR REPLACE FUNCTION public.validate_occupant_verification()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  -- Allow admins to bypass verification check
  IF EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RETURN NEW;
  END IF;

  -- For non-admin users, check verification status
  IF NOT EXISTS (
    SELECT 1 
    FROM profiles p 
    WHERE p.id = NEW.occupant_id 
    AND p.verification_status = 'verified'
  ) THEN
    RAISE EXCEPTION 'Cannot assign rooms to unverified occupants';
  END IF;
  RETURN NEW;
END;
$function$;