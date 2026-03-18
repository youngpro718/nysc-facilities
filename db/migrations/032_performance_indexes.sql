-- =============================================================================
-- Migration 032: Performance indexes for production load
--
-- All indexes use IF NOT EXISTS so the migration is idempotent.
--
-- NOTE: For tables that already have large amounts of data, run these
-- individually using CREATE INDEX CONCURRENTLY to avoid table locks:
--   psql -c "CREATE INDEX CONCURRENTLY idx_... ON ...;"
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Issues — most queried table in the admin dashboard
-- ---------------------------------------------------------------------------

-- Primary sort + status filter (replaces full-table scan on open issues)
CREATE INDEX IF NOT EXISTS idx_issues_created_at_desc
  ON issues(created_at DESC);

-- Partial index for the common case: non-closed issues
CREATE INDEX IF NOT EXISTS idx_issues_open_status
  ON issues(created_at DESC)
  WHERE status NOT IN ('closed', 'cancelled');

-- Status + priority compound (used by criticalIssues filter + stats)
CREATE INDEX IF NOT EXISTS idx_issues_status_priority
  ON issues(status, priority);

-- Building-level drill-down
CREATE INDEX IF NOT EXISTS idx_issues_building_status
  ON issues(building_id, status)
  WHERE status NOT IN ('closed', 'cancelled');

-- Assigned-to filter (staff workload views)
CREATE INDEX IF NOT EXISTS idx_issues_assigned_to
  ON issues(assigned_to)
  WHERE assigned_to IS NOT NULL;

-- Reporter lookup (drives the batch profile fetch)
CREATE INDEX IF NOT EXISTS idx_issues_reported_by
  ON issues(reported_by)
  WHERE reported_by IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Court sessions — primary query is (date + period + building_code)
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_court_sessions_date_period_building
  ON court_sessions(session_date, period, building_code);

-- Recent sessions per room (used by autocomplete)
CREATE INDEX IF NOT EXISTS idx_court_sessions_room_date
  ON court_sessions(court_room_id, session_date DESC);

-- ---------------------------------------------------------------------------
-- Supply requests
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_supply_requests_requester_created
  ON supply_requests(requester_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_supply_requests_status_created
  ON supply_requests(status, created_at DESC);

-- Fulfiller lookup
CREATE INDEX IF NOT EXISTS idx_supply_requests_fulfiller
  ON supply_requests(assigned_fulfiller_id)
  WHERE assigned_fulfiller_id IS NOT NULL;

-- Line items by request
CREATE INDEX IF NOT EXISTS idx_supply_request_items_request_id
  ON supply_request_items(request_id);

-- ---------------------------------------------------------------------------
-- Key requests
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_key_requests_user_status
  ON key_requests(user_id, status);

CREATE INDEX IF NOT EXISTS idx_key_requests_created
  ON key_requests(created_at DESC);

-- ---------------------------------------------------------------------------
-- Key assignments
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_key_assignments_user_id
  ON key_assignments(user_id);

CREATE INDEX IF NOT EXISTS idx_key_assignments_status
  ON key_assignments(status);

-- ---------------------------------------------------------------------------
-- Profiles — admin queue + full-text lookups
-- ---------------------------------------------------------------------------

-- Pending verification queue (small partial index, very fast)
CREATE INDEX IF NOT EXISTS idx_profiles_pending_verification
  ON profiles(created_at DESC)
  WHERE verification_status = 'pending';

-- General listing sort
CREATE INDEX IF NOT EXISTS idx_profiles_created_at_desc
  ON profiles(created_at DESC);

-- ---------------------------------------------------------------------------
-- Lighting
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_lighting_fixtures_building_status
  ON lighting_fixtures(building_id, status);

-- Fixtures needing maintenance
CREATE INDEX IF NOT EXISTS idx_lighting_fixtures_next_maintenance
  ON lighting_fixtures(next_maintenance_date)
  WHERE next_maintenance_date IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Walkthrough sessions
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_walkthrough_sessions_floor_status
  ON walkthrough_sessions(floor_id, status);

-- ---------------------------------------------------------------------------
-- AI invocation log — rate limiting window queries
-- (already has a composite index from migration 028, adding a covering index)
-- ---------------------------------------------------------------------------

-- If the per-user + per-function + time window query is slow:
CREATE INDEX IF NOT EXISTS idx_ai_invocation_recent
  ON ai_invocation_log(user_id, function_name, created_at DESC);

-- ---------------------------------------------------------------------------
-- Security rate limits — identifier lookup is the hot path
-- (idx_security_rate_limits_identifier already exists from migration 014)
-- Partial index for rows that have an active block set.
-- NOTE: Cannot use NOW() in index predicates (STABLE, not IMMUTABLE).
--       Use WHERE blocked_until IS NOT NULL only; filter the timestamp at query time.
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_rate_limits_blocked
  ON security_rate_limits(blocked_until)
  WHERE blocked_until IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Additional indexes identified in the deeper audit
-- ---------------------------------------------------------------------------

-- profiles.department_id — FK join used by authService.fetchUserProfile
CREATE INDEX IF NOT EXISTS idx_profiles_department_id
  ON profiles(department_id)
  WHERE department_id IS NOT NULL;

-- audit_logs — will become the largest table; admin audit UI scans by user and time
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id
  ON audit_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
  ON audit_logs(created_at DESC);

-- user_sessions — upsert key; requires unique index to function correctly
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_sessions_user_id
  ON user_sessions(user_id);

-- lighting_fixtures.floor_id — walkthrough queries filter by floor
CREATE INDEX IF NOT EXISTS idx_lighting_fixtures_floor_id
  ON lighting_fixtures(floor_id);

-- supply_request_items.inventory_item_id — nested join in getSupplyRequests
CREATE INDEX IF NOT EXISTS idx_supply_request_items_inventory_item
  ON supply_request_items(inventory_item_id)
  WHERE inventory_item_id IS NOT NULL;
