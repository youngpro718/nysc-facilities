-- Drop remaining security definer views that are causing warnings
-- These need to be replaced with proper functions or regular views

-- Drop the problematic security definer views
DROP VIEW IF EXISTS lighting_maintenance_view;
DROP VIEW IF EXISTS room_assignments_view;
DROP VIEW IF EXISTS key_orders_view;
DROP VIEW IF EXISTS inventory_items_view;
DROP VIEW IF EXISTS key_assignments_view;
DROP VIEW IF EXISTS key_audit_logs_view;
DROP VIEW IF EXISTS key_inventory_view;
DROP VIEW IF EXISTS personnel_profiles_view;
DROP VIEW IF EXISTS user_verification_view;

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

-- Update existing functions to have proper search_path
CREATE OR REPLACE FUNCTION public.validate_supply_request_inventory()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if requested quantity is available
  IF NEW.quantity_requested > (
    SELECT COALESCE(quantity, 0) 
    FROM inventory_items 
    WHERE id = NEW.item_id
  ) THEN
    RAISE EXCEPTION 'Insufficient inventory for item. Available: %, Requested: %', 
      (SELECT COALESCE(quantity, 0) FROM inventory_items WHERE id = NEW.item_id),
      NEW.quantity_requested;
  END IF;
  
  RETURN NEW;
END;
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