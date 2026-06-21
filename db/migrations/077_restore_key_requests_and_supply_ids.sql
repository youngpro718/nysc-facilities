-- Restore authenticated key requests and add readable daily supply-order IDs.

-- Prerequisite: this migration's RLS policies call is_key_manager(), but that
-- helper (originally from 051) is not present in the live DB. Recreate it here so
-- the migration is self-contained and applies cleanly.
CREATE OR REPLACE FUNCTION public.is_key_manager()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  -- Compare on role::text so labels absent from the user_role enum (e.g. system_admin)
  -- simply don't match instead of raising an invalid-enum-input error.
  SELECT EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = auth.uid()
      AND role::text IN ('admin', 'system_admin', 'facilities_manager', 'court_officer')
  );
$$;

CREATE TABLE IF NOT EXISTS public.key_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  key_id uuid REFERENCES public.keys(id) ON DELETE SET NULL,
  request_type text NOT NULL DEFAULT 'new'
    CHECK (request_type IN ('new', 'spare', 'replacement', 'temporary')),
  room_id uuid REFERENCES public.rooms(id) ON DELETE SET NULL,
  room_other text,
  reason text NOT NULL,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity BETWEEN 1 AND 10),
  emergency_contact text,
  email_notifications_enabled boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'ready', 'fulfilled', 'rejected', 'cancelled')),
  admin_notes text,
  rejection_reason text,
  fulfillment_notes text,
  approved_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at timestamptz,
  rejected_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  rejected_at timestamptz,
  last_status_change timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_key_requests_user_status
  ON public.key_requests(user_id, status);
CREATE INDEX IF NOT EXISTS idx_key_requests_created
  ON public.key_requests(created_at DESC);

ALTER TABLE public.key_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS key_requests_read ON public.key_requests;
CREATE POLICY key_requests_read ON public.key_requests
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_key_manager());

DROP POLICY IF EXISTS key_requests_insert ON public.key_requests;
CREATE POLICY key_requests_insert ON public.key_requests
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND status = 'pending');

DROP POLICY IF EXISTS key_requests_staff_update ON public.key_requests;
CREATE POLICY key_requests_staff_update ON public.key_requests
  FOR UPDATE TO authenticated
  USING (public.is_key_manager())
  WITH CHECK (public.is_key_manager());

DROP POLICY IF EXISTS key_requests_user_cancel ON public.key_requests;
CREATE POLICY key_requests_user_cancel ON public.key_requests
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND status = 'pending')
  WITH CHECK (user_id = auth.uid() AND status = 'cancelled');

GRANT SELECT, INSERT, UPDATE ON public.key_requests TO authenticated;

ALTER TABLE public.supply_requests
  ADD COLUMN IF NOT EXISTS display_id text;

WITH ranked AS (
  SELECT
    id,
    to_char(created_at AT TIME ZONE 'America/New_York', 'YYYY-MM-DD')
      || '-' ||
    lpad(
      row_number() OVER (
        PARTITION BY (created_at AT TIME ZONE 'America/New_York')::date
        ORDER BY created_at, id
      )::text,
      3,
      '0'
    ) AS friendly_id
  FROM public.supply_requests
  WHERE display_id IS NULL
)
UPDATE public.supply_requests AS request
SET display_id = ranked.friendly_id
FROM ranked
WHERE request.id = ranked.id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_supply_requests_display_id
  ON public.supply_requests(display_id)
  WHERE display_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.supply_request_daily_sequences (
  request_date date PRIMARY KEY,
  last_value integer NOT NULL DEFAULT 0
);

REVOKE ALL ON public.supply_request_daily_sequences FROM anon, authenticated;

INSERT INTO public.supply_request_daily_sequences(request_date, last_value)
SELECT
  (created_at AT TIME ZONE 'America/New_York')::date,
  count(*)::integer
FROM public.supply_requests
GROUP BY (created_at AT TIME ZONE 'America/New_York')::date
ON CONFLICT (request_date)
DO UPDATE SET last_value = GREATEST(
  public.supply_request_daily_sequences.last_value,
  EXCLUDED.last_value
);

CREATE OR REPLACE FUNCTION public.assign_supply_request_display_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  local_date date;
  next_value integer;
BEGIN
  IF NEW.display_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  local_date := (COALESCE(NEW.created_at, now()) AT TIME ZONE 'America/New_York')::date;

  INSERT INTO public.supply_request_daily_sequences(request_date, last_value)
  VALUES (local_date, 1)
  ON CONFLICT (request_date)
  DO UPDATE SET last_value = public.supply_request_daily_sequences.last_value + 1
  RETURNING last_value INTO next_value;

  NEW.display_id := to_char(local_date, 'YYYY-MM-DD') || '-' || lpad(next_value::text, 3, '0');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_supply_request_display_id ON public.supply_requests;
CREATE TRIGGER set_supply_request_display_id
  BEFORE INSERT ON public.supply_requests
  FOR EACH ROW EXECUTE FUNCTION public.assign_supply_request_display_id();
