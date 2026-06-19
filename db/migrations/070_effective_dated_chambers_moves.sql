-- Effective-dated chambers moves.
--
-- Planned moves are stored separately from current room/personnel assignments.
-- The current state changes only when a privileged user completes the plan.

BEGIN;

CREATE TABLE IF NOT EXISTS public.chambers_move_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  effective_date date NOT NULL,
  status text NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  completed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  completed_at timestamptz,
  cancelled_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  cancelled_at timestamptz,
  cancellation_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chambers_move_legs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL
    REFERENCES public.chambers_move_plans(id)
    ON DELETE CASCADE,
  personnel_id uuid NOT NULL
    REFERENCES public.personnel_profiles(id)
    ON DELETE RESTRICT,
  from_room_id uuid
    REFERENCES public.rooms(id)
    ON DELETE RESTRICT,
  to_room_id uuid NOT NULL
    REFERENCES public.rooms(id)
    ON DELETE RESTRICT,
  sequence_order integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chambers_move_legs_different_rooms
    CHECK (from_room_id IS NULL OR from_room_id <> to_room_id),
  CONSTRAINT chambers_move_legs_unique_person
    UNIQUE (plan_id, personnel_id),
  CONSTRAINT chambers_move_legs_unique_destination
    UNIQUE (plan_id, to_room_id)
);

CREATE INDEX IF NOT EXISTS idx_chambers_move_plans_status_date
  ON public.chambers_move_plans(status, effective_date);

CREATE INDEX IF NOT EXISTS idx_chambers_move_legs_personnel
  ON public.chambers_move_legs(personnel_id);

CREATE INDEX IF NOT EXISTS idx_chambers_move_legs_rooms
  ON public.chambers_move_legs(from_room_id, to_room_id);

ALTER TABLE public.chambers_move_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chambers_move_legs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS chambers_move_plans_read ON public.chambers_move_plans;
CREATE POLICY chambers_move_plans_read
  ON public.chambers_move_plans
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS chambers_move_plans_write ON public.chambers_move_plans;
CREATE POLICY chambers_move_plans_write
  ON public.chambers_move_plans
  FOR ALL TO authenticated
  USING (public.is_privileged())
  WITH CHECK (public.is_privileged());

DROP POLICY IF EXISTS chambers_move_legs_read ON public.chambers_move_legs;
CREATE POLICY chambers_move_legs_read
  ON public.chambers_move_legs
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS chambers_move_legs_write ON public.chambers_move_legs;
CREATE POLICY chambers_move_legs_write
  ON public.chambers_move_legs
  FOR ALL TO authenticated
  USING (public.is_privileged())
  WITH CHECK (public.is_privileged());

GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.chambers_move_plans, public.chambers_move_legs
  TO authenticated;

CREATE OR REPLACE FUNCTION public.create_chambers_move_plan(
  p_title text,
  p_effective_date date,
  p_notes text DEFAULT NULL,
  p_legs jsonb DEFAULT '[]'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_plan_id uuid;
  v_leg jsonb;
  v_leg_count integer;
BEGIN
  IF NOT public.is_privileged() THEN
    RAISE EXCEPTION 'Permission denied: privileged role required';
  END IF;

  IF NULLIF(trim(p_title), '') IS NULL THEN
    RAISE EXCEPTION 'Move plan title is required';
  END IF;

  IF p_effective_date IS NULL THEN
    RAISE EXCEPTION 'Effective date is required';
  END IF;

  IF jsonb_typeof(p_legs) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Move legs must be a JSON array';
  END IF;

  v_leg_count := jsonb_array_length(p_legs);
  IF v_leg_count = 0 THEN
    RAISE EXCEPTION 'At least one chambers move is required';
  END IF;

  INSERT INTO public.chambers_move_plans (
    title,
    effective_date,
    notes,
    created_by
  )
  VALUES (
    trim(p_title),
    p_effective_date,
    NULLIF(trim(p_notes), ''),
    auth.uid()
  )
  RETURNING id INTO v_plan_id;

  FOR v_leg IN SELECT value FROM jsonb_array_elements(p_legs)
  LOOP
    INSERT INTO public.chambers_move_legs (
      plan_id,
      personnel_id,
      from_room_id,
      to_room_id,
      sequence_order
    )
    VALUES (
      v_plan_id,
      (v_leg->>'personnel_id')::uuid,
      NULLIF(v_leg->>'from_room_id', '')::uuid,
      (v_leg->>'to_room_id')::uuid,
      COALESCE((v_leg->>'sequence_order')::integer, 1)
    );
  END LOOP;

  RETURN v_plan_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.complete_chambers_move_plan(
  p_plan_id uuid,
  p_force boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_plan public.chambers_move_plans%ROWTYPE;
  v_leg record;
  v_leg_count integer;
  v_conflict text;
BEGIN
  IF NOT public.is_privileged() THEN
    RAISE EXCEPTION 'Permission denied: privileged role required';
  END IF;

  SELECT *
  INTO v_plan
  FROM public.chambers_move_plans
  WHERE id = p_plan_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Chambers move plan not found';
  END IF;

  IF v_plan.status <> 'scheduled' THEN
    RAISE EXCEPTION 'Only scheduled move plans can be completed';
  END IF;

  IF NOT p_force AND current_date < v_plan.effective_date THEN
    RAISE EXCEPTION 'This move is effective on %. Complete it on or after that date.',
      v_plan.effective_date;
  END IF;

  SELECT count(*)
  INTO v_leg_count
  FROM public.chambers_move_legs
  WHERE plan_id = p_plan_id;

  IF v_leg_count = 0 THEN
    RAISE EXCEPTION 'This move plan has no move assignments';
  END IF;

  SELECT COALESCE(p.full_name, p.display_name, 'Unknown person')
    || ' is already assigned to Room ' || destination.room_number
  INTO v_conflict
  FROM public.chambers_move_legs leg
  JOIN public.rooms destination ON destination.id = leg.to_room_id
  JOIN public.personnel_profiles p
    ON p.chambers_room_number = destination.room_number
  WHERE leg.plan_id = p_plan_id
    AND p.id <> leg.personnel_id
    AND NOT EXISTS (
      SELECT 1
      FROM public.chambers_move_legs moving_person
      WHERE moving_person.plan_id = p_plan_id
        AND moving_person.personnel_id = p.id
    )
  LIMIT 1;

  IF v_conflict IS NOT NULL THEN
    RAISE EXCEPTION '%', v_conflict;
  END IF;

  -- Clear the current state for everyone and every source room in the plan.
  UPDATE public.personnel_profiles
  SET chambers_room_number = NULL,
      updated_at = now()
  WHERE id IN (
    SELECT personnel_id
    FROM public.chambers_move_legs
    WHERE plan_id = p_plan_id
  );

  UPDATE public.rooms
  SET name = 'Vacant',
      updated_at = now()
  WHERE id IN (
    SELECT from_room_id
    FROM public.chambers_move_legs
    WHERE plan_id = p_plan_id
      AND from_room_id IS NOT NULL
  );

  -- Apply each destination after sources are clear, allowing chained moves.
  FOR v_leg IN
    SELECT
      leg.personnel_id,
      leg.to_room_id,
      destination.room_number,
      COALESCE(person.full_name, person.display_name, 'Occupied') AS occupant_name
    FROM public.chambers_move_legs leg
    JOIN public.rooms destination ON destination.id = leg.to_room_id
    JOIN public.personnel_profiles person ON person.id = leg.personnel_id
    WHERE leg.plan_id = p_plan_id
    ORDER BY leg.sequence_order, leg.created_at
  LOOP
    UPDATE public.personnel_profiles
    SET chambers_room_number = v_leg.room_number,
        updated_at = now()
    WHERE id = v_leg.personnel_id;

    UPDATE public.rooms
    SET name = v_leg.occupant_name,
        updated_at = now()
    WHERE id = v_leg.to_room_id;
  END LOOP;

  UPDATE public.chambers_move_plans
  SET status = 'completed',
      completed_by = auth.uid(),
      completed_at = now(),
      updated_at = now()
  WHERE id = p_plan_id;

  RETURN jsonb_build_object(
    'plan_id', p_plan_id,
    'status', 'completed',
    'moves_applied', v_leg_count
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_chambers_move_plan(
  p_plan_id uuid,
  p_title text,
  p_effective_date date,
  p_notes text DEFAULT NULL,
  p_legs jsonb DEFAULT '[]'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_leg jsonb;
BEGIN
  IF NOT public.is_privileged() THEN
    RAISE EXCEPTION 'Permission denied: privileged role required';
  END IF;

  IF NULLIF(trim(p_title), '') IS NULL THEN
    RAISE EXCEPTION 'Move plan title is required';
  END IF;

  IF p_effective_date IS NULL THEN
    RAISE EXCEPTION 'Effective date is required';
  END IF;

  IF jsonb_typeof(p_legs) IS DISTINCT FROM 'array'
     OR jsonb_array_length(p_legs) = 0 THEN
    RAISE EXCEPTION 'At least one chambers move is required';
  END IF;

  UPDATE public.chambers_move_plans
  SET title = trim(p_title),
      effective_date = p_effective_date,
      notes = NULLIF(trim(p_notes), ''),
      updated_at = now()
  WHERE id = p_plan_id
    AND status = 'scheduled';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Scheduled chambers move plan not found';
  END IF;

  DELETE FROM public.chambers_move_legs
  WHERE plan_id = p_plan_id;

  FOR v_leg IN SELECT value FROM jsonb_array_elements(p_legs)
  LOOP
    INSERT INTO public.chambers_move_legs (
      plan_id,
      personnel_id,
      from_room_id,
      to_room_id,
      sequence_order
    )
    VALUES (
      p_plan_id,
      (v_leg->>'personnel_id')::uuid,
      NULLIF(v_leg->>'from_room_id', '')::uuid,
      (v_leg->>'to_room_id')::uuid,
      COALESCE((v_leg->>'sequence_order')::integer, 1)
    );
  END LOOP;
END;
$function$;

CREATE OR REPLACE FUNCTION public.cancel_chambers_move_plan(
  p_plan_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  IF NOT public.is_privileged() THEN
    RAISE EXCEPTION 'Permission denied: privileged role required';
  END IF;

  UPDATE public.chambers_move_plans
  SET status = 'cancelled',
      cancelled_by = auth.uid(),
      cancelled_at = now(),
      cancellation_reason = NULLIF(trim(p_reason), ''),
      updated_at = now()
  WHERE id = p_plan_id
    AND status = 'scheduled';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Scheduled chambers move plan not found';
  END IF;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.create_chambers_move_plan(text, date, text, jsonb)
  FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.complete_chambers_move_plan(uuid, boolean)
  FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_chambers_move_plan(uuid, text, date, text, jsonb)
  FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cancel_chambers_move_plan(uuid, text)
  FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.create_chambers_move_plan(text, date, text, jsonb)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_chambers_move_plan(uuid, boolean)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_chambers_move_plan(uuid, text, date, text, jsonb)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_chambers_move_plan(uuid, text)
  TO authenticated;

COMMIT;
