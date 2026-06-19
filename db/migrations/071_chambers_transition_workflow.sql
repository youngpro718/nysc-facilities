-- One-entry chambers transition workflow.
--
-- A transition creates the effective-dated move plan, selected maintenance
-- schedules, and only the officer-coverage tasks that are actually required.

BEGIN;

CREATE TABLE IF NOT EXISTS public.chambers_transition_work_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL
    REFERENCES public.chambers_move_plans(id)
    ON DELETE CASCADE,
  room_id uuid NOT NULL
    REFERENCES public.rooms(id)
    ON DELETE RESTRICT,
  work_type text NOT NULL
    CHECK (
      work_type IN (
        'painting',
        'cleaning',
        'electrical',
        'construction',
        'general',
        'security_coverage'
      )
    ),
  title text NOT NULL,
  scheduled_start_date timestamptz NOT NULL,
  scheduled_end_date timestamptz,
  requires_officer boolean NOT NULL DEFAULT false,
  notes text,
  maintenance_schedule_id uuid
    REFERENCES public.maintenance_schedules(id)
    ON DELETE SET NULL,
  staff_task_id uuid
    REFERENCES public.staff_tasks(id)
    ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chambers_transition_work_items_plan
  ON public.chambers_transition_work_items(plan_id);

CREATE INDEX IF NOT EXISTS idx_chambers_transition_work_items_room_date
  ON public.chambers_transition_work_items(room_id, scheduled_start_date);

ALTER TABLE public.chambers_transition_work_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS chambers_transition_work_items_read
  ON public.chambers_transition_work_items;
CREATE POLICY chambers_transition_work_items_read
  ON public.chambers_transition_work_items
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS chambers_transition_work_items_write
  ON public.chambers_transition_work_items;
CREATE POLICY chambers_transition_work_items_write
  ON public.chambers_transition_work_items
  FOR ALL TO authenticated
  USING (public.is_privileged())
  WITH CHECK (public.is_privileged());

GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.chambers_transition_work_items
  TO authenticated;

CREATE OR REPLACE FUNCTION public.create_chambers_transition(
  p_title text,
  p_effective_date date,
  p_notes text DEFAULT NULL,
  p_legs jsonb DEFAULT '[]'::jsonb,
  p_work_items jsonb DEFAULT '[]'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_plan_id uuid;
  v_work jsonb;
  v_room record;
  v_work_type text;
  v_title text;
  v_notes text;
  v_start timestamptz;
  v_end timestamptz;
  v_requires_officer boolean;
  v_maintenance_id uuid;
  v_task_id uuid;
  v_maintenance_count integer := 0;
  v_coverage_count integer := 0;
BEGIN
  IF NOT public.is_privileged() THEN
    RAISE EXCEPTION 'Permission denied: privileged role required';
  END IF;

  IF jsonb_typeof(p_work_items) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Preparation work must be a JSON array';
  END IF;

  v_plan_id := public.create_chambers_move_plan(
    p_title,
    p_effective_date,
    p_notes,
    p_legs
  );

  FOR v_work IN SELECT value FROM jsonb_array_elements(p_work_items)
  LOOP
    v_work_type := NULLIF(v_work->>'work_type', '');
    v_title := NULLIF(trim(v_work->>'title'), '');
    v_notes := NULLIF(trim(v_work->>'notes'), '');
    v_start := NULLIF(v_work->>'scheduled_start_date', '')::timestamptz;
    v_end := NULLIF(v_work->>'scheduled_end_date', '')::timestamptz;
    v_requires_officer :=
      COALESCE((v_work->>'requires_officer')::boolean, false);
    v_maintenance_id := NULL;
    v_task_id := NULL;

    IF v_work_type IS NULL OR v_title IS NULL OR v_start IS NULL THEN
      RAISE EXCEPTION 'Every preparation item needs a type, title, and start date';
    END IF;

    SELECT id, room_number, name
    INTO v_room
    FROM public.rooms
    WHERE id = (v_work->>'room_id')::uuid;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Preparation room not found';
    END IF;

    IF v_work_type <> 'security_coverage' THEN
      INSERT INTO public.maintenance_schedules (
        title,
        description,
        maintenance_type,
        space_name,
        space_id,
        space_type,
        scheduled_start_date,
        scheduled_end_date,
        status,
        priority,
        impact_level,
        notes,
        special_instructions,
        estimated_cost,
        notification_sent
      )
      VALUES (
        v_title,
        COALESCE(v_notes, ''),
        v_work_type,
        'Room ' || v_room.room_number,
        v_room.id,
        'courtroom',
        v_start,
        v_end,
        'scheduled',
        CASE WHEN v_requires_officer THEN 'high' ELSE 'medium' END,
        CASE WHEN v_requires_officer THEN 'moderate' ELSE 'minimal' END,
        COALESCE(v_notes, ''),
        CASE
          WHEN v_requires_officer
            THEN 'Court officer presence required while work is underway.'
          ELSE ''
        END,
        NULL,
        false
      )
      RETURNING id INTO v_maintenance_id;

      v_maintenance_count := v_maintenance_count + 1;
    END IF;

    IF v_requires_officer OR v_work_type = 'security_coverage' THEN
      INSERT INTO public.staff_tasks (
        title,
        description,
        task_type,
        priority,
        status,
        is_request,
        created_by,
        to_room_id,
        quantity,
        due_date
      )
      VALUES (
        CASE
          WHEN v_work_type = 'security_coverage' THEN v_title
          ELSE 'Officer coverage — ' || v_title
        END,
        concat_ws(
          E'\n',
          'Provide court officer coverage in Room ' || v_room.room_number || '.',
          v_notes
        ),
        'general',
        'high',
        'approved',
        false,
        auth.uid(),
        v_room.id,
        1,
        v_start
      )
      RETURNING id INTO v_task_id;

      v_coverage_count := v_coverage_count + 1;
    END IF;

    INSERT INTO public.chambers_transition_work_items (
      plan_id,
      room_id,
      work_type,
      title,
      scheduled_start_date,
      scheduled_end_date,
      requires_officer,
      notes,
      maintenance_schedule_id,
      staff_task_id
    )
    VALUES (
      v_plan_id,
      v_room.id,
      v_work_type,
      v_title,
      v_start,
      v_end,
      v_requires_officer OR v_work_type = 'security_coverage',
      v_notes,
      v_maintenance_id,
      v_task_id
    );
  END LOOP;

  RETURN jsonb_build_object(
    'plan_id', v_plan_id,
    'maintenance_schedules_created', v_maintenance_count,
    'coverage_tasks_created', v_coverage_count
  );
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

  UPDATE public.maintenance_schedules
  SET status = 'cancelled'
  WHERE id IN (
    SELECT maintenance_schedule_id
    FROM public.chambers_transition_work_items
    WHERE plan_id = p_plan_id
      AND maintenance_schedule_id IS NOT NULL
  )
    AND status NOT IN ('completed', 'cancelled');

  UPDATE public.staff_tasks
  SET status = 'cancelled',
      updated_at = now()
  WHERE id IN (
    SELECT staff_task_id
    FROM public.chambers_transition_work_items
    WHERE plan_id = p_plan_id
      AND staff_task_id IS NOT NULL
  )
    AND status NOT IN ('completed', 'cancelled');

  UPDATE public.chambers_transition_work_items
  SET status = 'cancelled',
      updated_at = now()
  WHERE plan_id = p_plan_id
    AND status = 'scheduled';
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.create_chambers_transition(
  text,
  date,
  text,
  jsonb,
  jsonb
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.create_chambers_transition(
  text,
  date,
  text,
  jsonb,
  jsonb
) TO authenticated;

COMMIT;
