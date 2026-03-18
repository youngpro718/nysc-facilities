-- =============================================================================
-- Migration 034: Missing security RPCs + building-level data isolation
--
-- Part 1 — Security RPCs
-- ----------------------
-- useSecurityValidation.ts and useSecureAuth.ts call 9 Postgres functions that
-- have never existed in any migration.  Every call was silently swallowed by
-- client-side try/catch fallbacks, leaving:
--   • Rate limiting completely non-functional
--   • Security event logging producing no audit trail
--   • Password validation falling through to a trivially weak client check
--
-- Functions created:
--   check_rate_limit            — core gate; called on every login/signup attempt
--   get_rate_limit_status       — returns current attempt/block state per identifier
--   reset_rate_limit            — clears state after a successful login
--   validate_email_format       — called before every signIn/signUp
--   sanitize_input              — called before every signIn/signUp
--   validate_password_strength  — called on signUp
--   validate_simple_password    — alternative password check called in secureSignUp
--   validate_user_session       — called by useSecurityValidation
--   log_security_event          — called on every auth event (login, logout, failure)
--
-- Part 2 — Building isolation
-- ---------------------------
-- All authenticated users currently read across all buildings regardless of
-- their assigned building.  Non-privileged (standard) users are now scoped to
-- their building; privileged users keep full access.
-- =============================================================================

-- =============================================================================
-- PART 1: Security RPCs
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Rate limit table with attempt_type support
--
-- The existing security_rate_limits table (migration 014) has no attempt_type
-- column, so the new functions that separate login/signup/etc. attempts use
-- this dedicated table.  The old table and its functions are left untouched
-- for backward compatibility.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.app_rate_limits (
  id               bigserial PRIMARY KEY,
  identifier       text        NOT NULL,
  attempt_type     text        NOT NULL DEFAULT 'login',
  attempts         int         NOT NULL DEFAULT 0,
  window_start     timestamptz NOT NULL DEFAULT now(),
  blocked_until    timestamptz,
  last_attempt_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (identifier, attempt_type)
);

CREATE INDEX IF NOT EXISTS idx_app_rate_limits_lookup
  ON app_rate_limits(identifier, attempt_type);

CREATE INDEX IF NOT EXISTS idx_app_rate_limits_blocked
  ON app_rate_limits(blocked_until)
  WHERE blocked_until IS NOT NULL;

-- RLS: only admins can read/manage; functions use SECURITY DEFINER to bypass.
ALTER TABLE public.app_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY app_rate_limits_admin ON public.app_rate_limits
  FOR ALL TO authenticated
  USING  (is_admin())
  WITH CHECK (is_admin());

-- ---------------------------------------------------------------------------
-- check_rate_limit
--
-- Called by useSecurityValidation.checkRateLimit() before every login/signup.
-- Returns TRUE if the attempt should be allowed, FALSE if blocked.
-- Also records the attempt atomically via upsert.
-- Must be callable by anon (the user is not yet authenticated at login time).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier    text,
  p_attempt_type  text    DEFAULT 'login',
  p_max_attempts  int     DEFAULT 10,
  p_window_minutes int    DEFAULT 15
)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row           app_rate_limits;
  v_window_start  timestamptz := now() - (p_window_minutes || ' minutes')::interval;
BEGIN
  -- Look up or create the rate limit row
  INSERT INTO app_rate_limits (identifier, attempt_type, attempts, window_start, last_attempt_at)
  VALUES (p_identifier, p_attempt_type, 1, now(), now())
  ON CONFLICT (identifier, attempt_type) DO UPDATE
    SET attempts        = CASE
                            -- Reset window if last attempt was outside the window
                            WHEN app_rate_limits.window_start < v_window_start
                            THEN 1
                            ELSE app_rate_limits.attempts + 1
                          END,
        window_start    = CASE
                            WHEN app_rate_limits.window_start < v_window_start
                            THEN now()
                            ELSE app_rate_limits.window_start
                          END,
        last_attempt_at = now(),
        -- Block if newly over the limit
        blocked_until   = CASE
                            WHEN app_rate_limits.blocked_until IS NOT NULL
                              AND app_rate_limits.blocked_until > now()
                            THEN app_rate_limits.blocked_until  -- already blocked
                            WHEN (CASE
                                    WHEN app_rate_limits.window_start < v_window_start THEN 1
                                    ELSE app_rate_limits.attempts + 1
                                  END) > p_max_attempts
                            THEN now() + interval '30 minutes'  -- newly blocked
                            ELSE NULL
                          END
  RETURNING * INTO v_row;

  -- Return false (blocked) if blocked_until is in the future
  RETURN v_row.blocked_until IS NULL OR v_row.blocked_until <= now();
END;
$$;

REVOKE ALL ON FUNCTION public.check_rate_limit(text, text, int, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, text, int, int) TO anon;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, text, int, int) TO authenticated;

-- ---------------------------------------------------------------------------
-- get_rate_limit_status
--
-- Called by useSecureAuth to show remaining attempts to the user.
-- Returns TABLE matching the RateLimitStatus TS interface.
-- Must be callable by anon (pre-login context).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_rate_limit_status(
  p_identifier   text,
  p_attempt_type text DEFAULT NULL
)
RETURNS TABLE (
  identifier    text,
  attempt_type  text,
  attempts      int,
  last_attempt  timestamptz,
  blocked_until timestamptz,
  is_blocked    boolean
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    r.identifier,
    r.attempt_type,
    r.attempts,
    r.last_attempt_at  AS last_attempt,
    r.blocked_until,
    (r.blocked_until IS NOT NULL AND r.blocked_until > now()) AS is_blocked
  FROM app_rate_limits r
  WHERE r.identifier   = p_identifier
    AND (p_attempt_type IS NULL OR r.attempt_type = p_attempt_type);
$$;

REVOKE ALL ON FUNCTION public.get_rate_limit_status(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_rate_limit_status(text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_rate_limit_status(text, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- reset_rate_limit
--
-- Called by useSecureAuth after a successful login to clear the counter.
-- Authenticated users may reset their own identifier (matched to their email);
-- admins may reset any identifier.
-- Returns true if a row was updated.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.reset_rate_limit(
  p_identifier   text,
  p_attempt_type text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_email text;
BEGIN
  -- Allow if admin, or if resetting own email's rate limit (post-login call)
  IF auth.uid() IS NOT NULL THEN
    SELECT email INTO v_user_email FROM profiles WHERE id = auth.uid();
  END IF;

  IF NOT (is_admin() OR v_user_email = p_identifier) THEN
    RAISE EXCEPTION 'permission denied: can only reset your own rate limit';
  END IF;

  UPDATE app_rate_limits
  SET attempts      = 0,
      blocked_until = NULL
  WHERE identifier  = p_identifier
    AND (p_attempt_type IS NULL OR attempt_type = p_attempt_type);

  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.reset_rate_limit(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reset_rate_limit(text, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- validate_email_format
--
-- Simple server-side email format check; called on every login/signup form.
-- Callable by anon (pre-auth).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validate_email_format(email text)
RETURNS boolean
LANGUAGE sql IMMUTABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email ~ '^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$';
$$;

REVOKE ALL ON FUNCTION public.validate_email_format(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_email_format(text) TO anon;
GRANT EXECUTE ON FUNCTION public.validate_email_format(text) TO authenticated;

-- ---------------------------------------------------------------------------
-- sanitize_input
--
-- Strips leading/trailing whitespace and collapses internal whitespace runs.
-- The client already sanitizes; this is a server-side safety layer.
-- Callable by anon.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sanitize_input(input_text text)
RETURNS text
LANGUAGE sql IMMUTABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT TRIM(REGEXP_REPLACE(COALESCE(input_text, ''), '\s+', ' ', 'g'));
$$;

REVOKE ALL ON FUNCTION public.sanitize_input(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sanitize_input(text) TO anon;
GRANT EXECUTE ON FUNCTION public.sanitize_input(text) TO authenticated;

-- ---------------------------------------------------------------------------
-- validate_password_strength  (used by useSecurityValidation.validatePassword)
-- validate_simple_password    (used by useSecureAuth.secureSignUp fallback)
--
-- Both return { is_valid: bool, errors: text[] }.
-- Rules: ≥8 chars, upper, lower, digit, special.
-- Callable by anon (signup form, pre-auth).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validate_password_strength(password text)
RETURNS jsonb
LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_errors text[] := ARRAY[]::text[];
BEGIN
  IF length(password) < 8 THEN
    v_errors := array_append(v_errors, 'Password must be at least 8 characters');
  END IF;
  IF password !~ '[A-Z]' THEN
    v_errors := array_append(v_errors, 'Password must contain at least one uppercase letter');
  END IF;
  IF password !~ '[a-z]' THEN
    v_errors := array_append(v_errors, 'Password must contain at least one lowercase letter');
  END IF;
  IF password !~ '[0-9]' THEN
    v_errors := array_append(v_errors, 'Password must contain at least one number');
  END IF;
  IF password !~ '[^a-zA-Z0-9]' THEN
    v_errors := array_append(v_errors, 'Password must contain at least one special character');
  END IF;

  RETURN jsonb_build_object(
    'is_valid', array_length(v_errors, 1) IS NULL,
    'errors',   to_jsonb(v_errors)
  );
END;
$$;

-- validate_simple_password is identical but has a different name that the
-- secureSignUp code path calls
CREATE OR REPLACE FUNCTION public.validate_simple_password(password text)
RETURNS jsonb
LANGUAGE sql IMMUTABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.validate_password_strength(password);
$$;

REVOKE ALL ON FUNCTION public.validate_password_strength(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.validate_simple_password(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_password_strength(text) TO anon;
GRANT EXECUTE ON FUNCTION public.validate_password_strength(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_simple_password(text) TO anon;
GRANT EXECUTE ON FUNCTION public.validate_simple_password(text) TO authenticated;

-- ---------------------------------------------------------------------------
-- validate_user_session
--
-- Returns true if the caller has an active, authenticated session.
-- Trivially implemented: if auth.uid() is non-null, the JWT is valid
-- (PostgREST has already verified the signature and expiry before executing).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validate_user_session()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL;
$$;

REVOKE ALL ON FUNCTION public.validate_user_session() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_user_session() TO authenticated;

-- ---------------------------------------------------------------------------
-- log_security_event
--
-- Writes an entry to audit_logs.  Called on every auth event (successful
-- login, failed login, signup, rate-limit exceeded, etc.).
-- Callable by anon so pre-authentication failures are captured.
-- Swallows all errors to remain non-blocking.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.log_security_event(
  action_type    text,
  resource_type  text,
  resource_id    text    DEFAULT NULL,
  details        jsonb   DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record_id uuid;
BEGIN
  -- Safely cast the resource_id text to uuid; ignore zero-UUID placeholder
  BEGIN
    IF resource_id IS NOT NULL AND resource_id <> '00000000-0000-0000-0000-000000000000' THEN
      v_record_id := resource_id::uuid;
    END IF;
  EXCEPTION WHEN invalid_text_representation THEN
    NULL; -- non-uuid resource_id — leave v_record_id as NULL
  END;

  INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values)
  VALUES (auth.uid(), action_type, resource_type, v_record_id, details);
EXCEPTION WHEN OTHERS THEN
  NULL; -- Never let audit logging break the main auth flow
END;
$$;

REVOKE ALL ON FUNCTION public.log_security_event(text, text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_security_event(text, text, text, jsonb) TO anon;
GRANT EXECUTE ON FUNCTION public.log_security_event(text, text, text, jsonb) TO authenticated;

-- =============================================================================
-- PART 2: Building-level data isolation
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Helper: get_user_building_id
--
-- Returns the building UUID for the current user by joining profiles.building
-- (a text name) to buildings.name.  Returns NULL if the user has no building
-- assigned or if the name does not match a row in the buildings table.
-- When NULL is returned the calling policy falls through to allow all buildings
-- (graceful degradation: an unassigned user is not locked out).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_building_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT b.id
  FROM   profiles p
  JOIN   buildings b ON b.name = p.building
  WHERE  p.id = auth.uid()
  LIMIT  1;
$$;

-- ---------------------------------------------------------------------------
-- Helper: get_user_building_code
--
-- Returns the raw building text stored in profiles.building.
-- Used for court_sessions which key on building_code (text), not a UUID.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_building_code()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT building FROM profiles WHERE id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- Update read policies on the three spatial tables to scope standard users
-- to their assigned building.
--
-- Policy logic (same for all three):
--   • admin / cmc             → see all  (privileged)
--   • court_aide              → see all  (manages supply across buildings)
--   • standard + no building  → see all  (graceful degradation)
--   • standard + building set → see only own building
-- ---------------------------------------------------------------------------

-- rooms
DROP POLICY IF EXISTS rooms_read ON public.rooms;
CREATE POLICY rooms_read ON public.rooms
  FOR SELECT TO authenticated
  USING (
    is_privileged()
    OR has_any_role(ARRAY['court_aide'])
    OR get_user_building_id() IS NULL
    OR building_id = get_user_building_id()
  );

-- issues
DROP POLICY IF EXISTS issues_read ON public.issues;
CREATE POLICY issues_read ON public.issues
  FOR SELECT TO authenticated
  USING (
    is_privileged()
    OR has_any_role(ARRAY['court_aide'])
    OR building_id IS NULL
    OR get_user_building_id() IS NULL
    OR building_id = get_user_building_id()
  );

-- court_sessions — keyed on building_code (text), not UUID
DROP POLICY IF EXISTS court_sessions_read ON public.court_sessions;
CREATE POLICY court_sessions_read ON public.court_sessions
  FOR SELECT TO authenticated
  USING (
    is_privileged()
    OR get_user_building_code() IS NULL
    OR building_code = get_user_building_code()
  );

-- lighting_fixtures — scoped by building_id
DROP POLICY IF EXISTS lighting_fixtures_read ON public.lighting_fixtures;
CREATE POLICY lighting_fixtures_read ON public.lighting_fixtures
  FOR SELECT TO authenticated
  USING (
    is_admin()
    OR get_user_building_id() IS NULL
    OR building_id = get_user_building_id()
  );
