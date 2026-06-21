-- Migration 082: Per-user opt-in to skip the supply order code prompt.
--
-- Default false: everyone is prompted at the threshold. Admins flip this on
-- for trusted users (themselves, executives, etc.). The user still has a
-- 4-digit code on their profile so someone ordering on their behalf can use it.
--
-- Applied to live DB.

BEGIN;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bypass_supply_order_code boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.bypass_supply_order_code IS
  'When true, this user is NOT prompted for their supply order code at the cart, regardless of any item threshold. Their code still exists for delegated ordering.';

-- Admin-only RPC (profiles RLS only allows self-update).
CREATE OR REPLACE FUNCTION public.admin_set_supply_code_bypass(p_user_id uuid, p_bypass boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT has_role('admin'::user_role) THEN
    RAISE EXCEPTION 'admin role required';
  END IF;
  UPDATE public.profiles SET bypass_supply_order_code = COALESCE(p_bypass, false) WHERE id = p_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_supply_code_bypass(uuid, boolean) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.admin_set_supply_code_bypass(uuid, boolean) TO authenticated;

COMMIT;
