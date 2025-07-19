
-- Update handle_user_verification function to check for pre-imported occupants
CREATE OR REPLACE FUNCTION public.handle_user_verification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    IF NEW.verification_status = 'verified' AND OLD.verification_status = 'pending' THEN
        -- Check if email domain is nycourt.gov
        IF NEW.email IS NOT NULL AND NEW.email LIKE '%@nycourt.gov' THEN
            BEGIN
                -- Check if occupant already exists with this email
                IF EXISTS (SELECT 1 FROM occupants WHERE LOWER(email) = LOWER(NEW.email)) THEN
                    -- Update existing occupant record with user ID
                    UPDATE occupants 
                    SET id = NEW.id, status = 'active', updated_at = now()
                    WHERE LOWER(email) = LOWER(NEW.email);
                ELSE
                    -- Create new occupant record
                    INSERT INTO occupants (id, first_name, last_name, email, status)
                    VALUES (NEW.id, NEW.first_name, NEW.last_name, NEW.email, 'active');
                END IF;
                EXCEPTION WHEN OTHERS THEN
                    RAISE NOTICE 'Error handling occupant verification: %', SQLERRM;
            END;
        END IF;
    END IF;
    RETURN NEW;
END;
$function$;

-- Add email domain validation function
CREATE OR REPLACE FUNCTION public.validate_nycourt_email(email_address text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $function$
    SELECT email_address LIKE '%@nycourt.gov';
$function$;

-- Add index for faster email lookups in occupants table
CREATE INDEX IF NOT EXISTS idx_occupants_email_lower ON occupants(LOWER(email));

-- Update occupants table to ensure email uniqueness
ALTER TABLE occupants ADD CONSTRAINT unique_occupant_email UNIQUE (email);
