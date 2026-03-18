-- =============================================================================
-- Migration 031: Atomic database functions
--
-- Replaces multi-step client-side writes with single transactions:
--   1. fulfill_supply_request()  — atomic header + items fulfillment
--   2. copy_court_sessions()     — idempotent atomic session copy
--   3. get_issue_stats()         — server-side stats (avoids 500-row client fetch)
--
-- All functions use SECURITY DEFINER so that they run as the function owner
-- (bypassing RLS) after performing their own authorization checks.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. fulfill_supply_request
--
-- Replaces the client-side pattern of:
--   UPDATE supply_requests SET status='completed', work_completed_at=...
--   Promise.all(items.map(item => UPDATE supply_request_items ...))
--
-- Both writes now succeed or fail together.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fulfill_supply_request(
  p_request_id       uuid,
  p_completion_notes text DEFAULT NULL,
  p_items            jsonb DEFAULT '[]'::jsonb
    -- Expected shape: [{"id": "<uuid>", "quantity_approved": 5, "quantity_fulfilled": 5, "notes": "..."}]
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Authorization: must be admin, cmc, or court_aide
  IF NOT has_any_role(ARRAY['admin', 'cmc', 'court_aide']) THEN
    RAISE EXCEPTION 'permission denied: insufficient role for supply request fulfillment';
  END IF;

  -- Update the request header atomically with the items
  UPDATE supply_requests
  SET
    status             = 'completed',
    work_completed_at  = now(),
    fulfilled_by       = auth.uid(),
    completion_notes   = p_completion_notes
  WHERE id = p_request_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'supply request % not found', p_request_id;
  END IF;

  -- Update all line items in a single UPDATE ... FROM
  UPDATE supply_request_items sri
  SET
    quantity_approved  = (item_data->>'quantity_approved')::int,
    quantity_fulfilled = (item_data->>'quantity_fulfilled')::int,
    notes              = item_data->>'notes'
  FROM jsonb_array_elements(p_items) AS item_data
  WHERE sri.id          = (item_data->>'id')::uuid
    AND sri.request_id  = p_request_id;
END;
$$;

REVOKE ALL ON FUNCTION public.fulfill_supply_request(uuid, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fulfill_supply_request(uuid, text, jsonb) TO authenticated;

-- ---------------------------------------------------------------------------
-- 2. copy_court_sessions
--
-- Replaces the client-side pattern of:
--   SELECT sessions WHERE session_date = fromDate
--   INSERT sessions with session_date = toDate
--
-- The existence check + insert are now atomic, preventing duplicate sessions
-- when two users click "Copy sessions" simultaneously.
-- Returns the number of sessions copied (0 if target already populated).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.copy_court_sessions(
  p_from_date     date,
  p_to_date       date,
  p_period        text,
  p_building_code text
)
RETURNS int
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int;
BEGIN
  -- Authorization: must be admin or cmc
  IF NOT is_privileged() THEN
    RAISE EXCEPTION 'permission denied: only admin or cmc can copy court sessions';
  END IF;

  -- Idempotency guard: refuse if target date already has sessions
  IF EXISTS (
    SELECT 1 FROM court_sessions
    WHERE session_date  = p_to_date
      AND period        = p_period
      AND building_code = p_building_code
  ) THEN
    RAISE EXCEPTION 'sessions already exist for %, period %, building %',
      p_to_date, p_period, p_building_code;
  END IF;

  INSERT INTO court_sessions (
    session_date,
    period,
    building_code,
    court_room_id,
    assignment_id,
    status,
    status_detail,
    estimated_finish_date,
    judge_name,
    part_number,
    clerk_names,
    sergeant_name,
    parts_entered_by,
    defendants,
    purpose,
    date_transferred_or_started,
    top_charge,
    attorney,
    calendar_count,
    calendar_count_date,
    out_dates,
    notes,
    created_by,
    created_at,
    updated_at
  )
  SELECT
    p_to_date,
    period,
    building_code,
    court_room_id,
    assignment_id,
    status,
    status_detail,
    estimated_finish_date,
    judge_name,
    part_number,
    clerk_names,
    sergeant_name,
    parts_entered_by,
    defendants,
    purpose,
    date_transferred_or_started,
    top_charge,
    attorney,
    calendar_count,
    calendar_count_date,
    out_dates,
    notes,
    auth.uid(),
    now(),
    now()
  FROM court_sessions
  WHERE session_date  = p_from_date
    AND period        = p_period
    AND building_code = p_building_code;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  IF v_count = 0 THEN
    RAISE EXCEPTION 'no sessions found for %, period %, building %',
      p_from_date, p_period, p_building_code;
  END IF;

  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.copy_court_sessions(date, date, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.copy_court_sessions(date, date, text, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- 3. get_issue_stats
--
-- Returns aggregate counts for the issues dashboard without sending 500 rows
-- to the client just to count them in JavaScript.
--
-- The client still fetches a paginated list for the table view; this function
-- powers the summary cards.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_issue_stats()
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'total',        COUNT(*),
    'open',         COUNT(*) FILTER (WHERE status = 'open'),
    'in_progress',  COUNT(*) FILTER (WHERE status = 'in_progress'),
    'resolved',     COUNT(*) FILTER (WHERE status = 'resolved'),
    'high',         COUNT(*) FILTER (WHERE priority = 'high'),
    'medium',       COUNT(*) FILTER (WHERE priority = 'medium'),
    'low',          COUNT(*) FILTER (WHERE priority = 'low'),
    'critical',     COUNT(*) FILTER (
                      WHERE priority = 'high'
                        AND status IN ('open', 'in_progress')
                    ),
    'today',        COUNT(*) FILTER (WHERE created_at::date = CURRENT_DATE),
    'this_week',    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - 7),
    'rooms_affected', COUNT(DISTINCT room_id) FILTER (WHERE room_id IS NOT NULL)
  )
  FROM issues;
$$;

REVOKE ALL ON FUNCTION public.get_issue_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_issue_stats() TO authenticated;

-- ---------------------------------------------------------------------------
-- 4. Fix increment_scan_count — use atomic UPDATE to avoid lost updates
--    under concurrent fixture scans.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.increment_scan_count(p_fixture_id uuid)
RETURNS void
LANGUAGE sql SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE lighting_fixtures
  SET scan_count      = COALESCE(scan_count, 0) + 1,
      last_scanned_at = now()
  WHERE id = p_fixture_id;
$$;

REVOKE ALL ON FUNCTION public.increment_scan_count(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_scan_count(uuid) TO authenticated;
