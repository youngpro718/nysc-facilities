-- 079_supply_packaging_and_order_codes.sql
-- Packaging tiers for inventory items (single -> pack -> case) so supplies can be
-- ordered and understood by packaging instead of raw counts, plus per-person
-- "supply order codes" that authorize/track large orders without an approval wait.
--
-- Applied to the live project (fmymhtuiqzhupjyopfvi) via Supabase migration
-- 079_supply_packaging_and_order_codes.

-- 1. Packaging tiers on inventory_items (pack_size/unit/packaging_note already exist)
ALTER TABLE public.inventory_items
  ADD COLUMN IF NOT EXISTS pack_label text,
  ADD COLUMN IF NOT EXISTS case_label text,
  ADD COLUMN IF NOT EXISTS case_size integer,            -- packs per case
  ADD COLUMN IF NOT EXISTS order_code_threshold integer; -- smallest-units above which a personal code is required

COMMENT ON COLUMN public.inventory_items.pack_label IS 'Label for the middle packaging tier (e.g. pack, box).';
COMMENT ON COLUMN public.inventory_items.case_label IS 'Label for the top packaging tier (e.g. case).';
COMMENT ON COLUMN public.inventory_items.case_size IS 'Number of packs in one case.';
COMMENT ON COLUMN public.inventory_items.order_code_threshold IS 'Order quantity (in smallest units) above which a personal access code is required.';

-- 2. Per-person supply order code (hashed; never returned to the client)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS supply_order_code_hash text;

-- Admin assigns or clears a person's code
CREATE OR REPLACE FUNCTION public.set_supply_order_code(p_user_id uuid, p_code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can set supply order codes';
  END IF;
  IF p_code IS NULL OR length(trim(p_code)) = 0 THEN
    UPDATE public.profiles SET supply_order_code_hash = NULL WHERE id = p_user_id;
  ELSE
    UPDATE public.profiles SET supply_order_code_hash = crypt(p_code, gen_salt('bf')) WHERE id = p_user_id;
  END IF;
END;
$$;

-- Current user verifies their own code; returns boolean only (hash never leaves the server)
CREATE OR REPLACE FUNCTION public.verify_supply_order_code(p_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_hash text;
BEGIN
  SELECT supply_order_code_hash INTO v_hash FROM public.profiles WHERE id = auth.uid();
  IF v_hash IS NULL THEN
    RETURN false;
  END IF;
  RETURN v_hash = crypt(p_code, v_hash);
END;
$$;

-- Whether a user has a code set at all (for UI gating). Defaults to current user.
CREATE OR REPLACE FUNCTION public.has_supply_order_code(p_user_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT supply_order_code_hash IS NOT NULL
  FROM public.profiles
  WHERE id = COALESCE(p_user_id, auth.uid());
$$;

REVOKE ALL ON FUNCTION public.set_supply_order_code(uuid, text) FROM anon, public;
REVOKE ALL ON FUNCTION public.verify_supply_order_code(text) FROM anon, public;
REVOKE ALL ON FUNCTION public.has_supply_order_code(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.set_supply_order_code(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_supply_order_code(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_supply_order_code(uuid) TO authenticated;
