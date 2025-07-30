-- Drop remaining security definer views with proper CASCADE handling
-- These need to be replaced with proper functions or regular views

-- Drop the problematic security definer views with CASCADE to handle dependencies
DROP VIEW IF EXISTS lighting_maintenance_view CASCADE;
DROP VIEW IF EXISTS room_assignments_view CASCADE;
DROP VIEW IF EXISTS key_orders_view CASCADE;
DROP VIEW IF EXISTS inventory_items_view CASCADE;
DROP VIEW IF EXISTS key_assignments_view CASCADE;
DROP VIEW IF EXISTS key_audit_logs_view CASCADE;
DROP VIEW IF EXISTS key_inventory_view CASCADE;
DROP VIEW IF EXISTS personnel_profiles_view CASCADE;
DROP VIEW IF EXISTS user_verification_view CASCADE;

-- Also drop any dependent views that might exist
DROP VIEW IF EXISTS key_inventory_stats CASCADE;

-- Create secure functions to replace some of the critical views
CREATE OR REPLACE FUNCTION public.get_user_verification_info()
RETURNS TABLE (
  user_id uuid,
  email text,
  first_name text,
  last_name text,
  verification_status text,
  role text,
  created_at timestamp with time zone
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT 
    p.id as user_id,
    p.email,
    p.first_name,
    p.last_name,
    p.verification_status,
    COALESCE(ur.role::text, 'standard') as role,
    p.created_at
  FROM profiles p
  LEFT JOIN user_roles ur ON ur.user_id = p.id
  WHERE p.verification_status IS NOT NULL;
$$;

CREATE OR REPLACE FUNCTION public.get_key_inventory_summary()
RETURNS TABLE (
  key_id uuid,
  key_name text,
  key_type text,
  total_quantity integer,
  available_quantity integer,
  reserved_quantity integer,
  status text
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT 
    k.id as key_id,
    k.name as key_name,
    k.type as key_type,
    k.total_quantity,
    k.available_quantity,
    (k.total_quantity - k.available_quantity) as reserved_quantity,
    k.status
  FROM keys k
  WHERE k.status = 'active';
$$;

-- Grant proper permissions for the security functions
GRANT EXECUTE ON FUNCTION public.get_user_verification_info() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_key_inventory_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_email_format(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_password_strength(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sanitize_input(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_user_session() TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_security_event(text, text, uuid, jsonb, inet, text) TO authenticated;