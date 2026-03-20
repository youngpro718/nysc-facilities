-- =============================================================================
-- Migration 062: Add Pagination Support for Large Data Sets
--
-- Audit Finding: MEDIUM-19
-- Large tables (issues, supply_requests, audit_logs, profiles) lack pagination,
-- causing performance issues when loading all records.
--
-- This migration:
-- 1. Adds indexes to support efficient pagination
-- 2. Creates helper functions for cursor-based pagination
-- 3. Documents pagination best practices
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Add pagination indexes for large tables
-- ---------------------------------------------------------------------------

-- Issues table - paginate by created_at DESC (most recent first)
CREATE INDEX IF NOT EXISTS idx_issues_pagination 
  ON issues(created_at DESC, id);

-- Supply requests - paginate by created_at DESC
CREATE INDEX IF NOT EXISTS idx_supply_requests_pagination 
  ON supply_requests(created_at DESC, id);

-- Profiles - paginate by created_at DESC (for admin user list)
CREATE INDEX IF NOT EXISTS idx_profiles_pagination 
  ON profiles(created_at DESC, id);

-- Admin actions - paginate by created_at DESC
CREATE INDEX IF NOT EXISTS idx_admin_actions_pagination 
  ON admin_actions(created_at DESC, id);

-- Walkthrough sessions - paginate by started_at DESC
CREATE INDEX IF NOT EXISTS idx_walkthrough_sessions_pagination 
  ON walkthrough_sessions(started_at DESC, id);

-- Court sessions - paginate by session_date DESC
CREATE INDEX IF NOT EXISTS idx_court_sessions_pagination 
  ON court_sessions(session_date DESC, id);

-- ---------------------------------------------------------------------------
-- 2. Create cursor-based pagination helper function
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION get_pagination_info(
  p_table_name text,
  p_total_count bigint,
  p_page_size integer,
  p_current_cursor text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_has_more boolean;
  v_total_pages integer;
BEGIN
  v_total_pages := CEIL(p_total_count::float / p_page_size);
  v_has_more := p_total_count > p_page_size;
  
  RETURN jsonb_build_object(
    'total_count', p_total_count,
    'page_size', p_page_size,
    'total_pages', v_total_pages,
    'has_more', v_has_more,
    'current_cursor', p_current_cursor
  );
END;
$$;

COMMENT ON FUNCTION get_pagination_info(text, bigint, integer, text) IS 
  'Returns pagination metadata for cursor-based pagination.';

-- ---------------------------------------------------------------------------
-- 3. Document pagination best practices
-- ---------------------------------------------------------------------------

COMMENT ON INDEX idx_issues_pagination IS 
  'Supports cursor-based pagination for issues. Use: WHERE created_at < $cursor ORDER BY created_at DESC, id LIMIT $page_size';

COMMENT ON INDEX idx_supply_requests_pagination IS 
  'Supports cursor-based pagination for supply requests. Use: WHERE created_at < $cursor ORDER BY created_at DESC, id LIMIT $page_size';

COMMENT ON INDEX idx_profiles_pagination IS 
  'Supports cursor-based pagination for profiles. Use: WHERE created_at < $cursor ORDER BY created_at DESC, id LIMIT $page_size';

-- ---------------------------------------------------------------------------
-- 4. Create example paginated query functions
-- ---------------------------------------------------------------------------

-- Example: Paginated issues query
CREATE OR REPLACE FUNCTION get_issues_paginated(
  p_page_size integer DEFAULT 50,
  p_cursor timestamptz DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_priority text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  status text,
  priority text,
  reported_by uuid,
  created_at timestamptz,
  next_cursor timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.title,
    i.description,
    i.status,
    i.priority,
    i.reported_by,
    i.created_at,
    i.created_at as next_cursor
  FROM issues i
  WHERE 
    (p_cursor IS NULL OR i.created_at < p_cursor)
    AND (p_status IS NULL OR i.status = p_status)
    AND (p_priority IS NULL OR i.priority = p_priority)
  ORDER BY i.created_at DESC, i.id
  LIMIT p_page_size;
END;
$$;

COMMENT ON FUNCTION get_issues_paginated(integer, timestamptz, text, text) IS 
  'Returns paginated issues with optional status/priority filters. Use next_cursor from last row for next page.';

-- Example: Paginated supply requests query
CREATE OR REPLACE FUNCTION get_supply_requests_paginated(
  p_page_size integer DEFAULT 50,
  p_cursor timestamptz DEFAULT NULL,
  p_status text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  requested_by uuid,
  status text,
  items jsonb,
  created_at timestamptz,
  next_cursor timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sr.id,
    sr.requested_by,
    sr.status,
    sr.items,
    sr.created_at,
    sr.created_at as next_cursor
  FROM supply_requests sr
  WHERE 
    (p_cursor IS NULL OR sr.created_at < p_cursor)
    AND (p_status IS NULL OR sr.status = p_status)
    AND (
      is_supply_staff() OR 
      is_purchasing() OR 
      sr.requested_by = auth.uid()
    )
  ORDER BY sr.created_at DESC, sr.id
  LIMIT p_page_size;
END;
$$;

COMMENT ON FUNCTION get_supply_requests_paginated(integer, timestamptz, text) IS 
  'Returns paginated supply requests with RLS enforcement. Use next_cursor from last row for next page.';

-- ---------------------------------------------------------------------------
-- 5. Create pagination statistics view
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW pagination_statistics AS
SELECT 
  'issues' as table_name,
  (SELECT COUNT(*) FROM issues) as total_rows,
  50 as recommended_page_size,
  CEIL((SELECT COUNT(*) FROM issues)::float / 50) as estimated_pages
UNION ALL
SELECT 
  'supply_requests',
  (SELECT COUNT(*) FROM supply_requests),
  50,
  CEIL((SELECT COUNT(*) FROM supply_requests)::float / 50)
UNION ALL
SELECT 
  'profiles',
  (SELECT COUNT(*) FROM profiles),
  50,
  CEIL((SELECT COUNT(*) FROM profiles)::float / 50)
UNION ALL
SELECT 
  'admin_actions',
  (SELECT COUNT(*) FROM admin_actions),
  100,
  CEIL((SELECT COUNT(*) FROM admin_actions)::float / 100)
UNION ALL
SELECT 
  'walkthrough_sessions',
  (SELECT COUNT(*) FROM walkthrough_sessions),
  50,
  CEIL((SELECT COUNT(*) FROM walkthrough_sessions)::float / 50)
UNION ALL
SELECT 
  'court_sessions',
  (SELECT COUNT(*) FROM court_sessions),
  50,
  CEIL((SELECT COUNT(*) FROM court_sessions)::float / 50);

COMMENT ON VIEW pagination_statistics IS 
  'Shows row counts and recommended page sizes for tables that should use pagination.';

GRANT SELECT ON pagination_statistics TO authenticated;

-- ---------------------------------------------------------------------------
-- 6. Verification
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  v_index_count int;
BEGIN
  RAISE NOTICE '=================================================================';
  RAISE NOTICE 'Pagination Support - Installation Complete';
  RAISE NOTICE '=================================================================';
  RAISE NOTICE '';
  
  -- Count pagination indexes
  SELECT COUNT(*) INTO v_index_count
  FROM pg_indexes
  WHERE indexname LIKE '%_pagination';
  
  RAISE NOTICE 'Pagination indexes created: %', v_index_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Indexes:';
  RAISE NOTICE '  ✓ idx_issues_pagination';
  RAISE NOTICE '  ✓ idx_supply_requests_pagination';
  RAISE NOTICE '  ✓ idx_profiles_pagination';
  RAISE NOTICE '  ✓ idx_admin_actions_pagination';
  RAISE NOTICE '  ✓ idx_walkthrough_sessions_pagination';
  RAISE NOTICE '  ✓ idx_court_sessions_pagination';
  RAISE NOTICE '';
  RAISE NOTICE 'Helper functions:';
  RAISE NOTICE '  ✓ get_pagination_info() - Metadata helper';
  RAISE NOTICE '  ✓ get_issues_paginated() - Example paginated query';
  RAISE NOTICE '  ✓ get_supply_requests_paginated() - Example paginated query';
  RAISE NOTICE '';
  RAISE NOTICE 'Helper views:';
  RAISE NOTICE '  ✓ pagination_statistics - Row counts and page estimates';
  RAISE NOTICE '';
  RAISE NOTICE 'Pagination Pattern (Cursor-Based):';
  RAISE NOTICE '  1. First page: SELECT * FROM table ORDER BY created_at DESC LIMIT 50';
  RAISE NOTICE '  2. Next page: SELECT * FROM table WHERE created_at < $last_cursor ORDER BY created_at DESC LIMIT 50';
  RAISE NOTICE '  3. Use created_at from last row as cursor for next page';
  RAISE NOTICE '';
  RAISE NOTICE 'Benefits:';
  RAISE NOTICE '  - Consistent performance regardless of page number';
  RAISE NOTICE '  - No OFFSET overhead for deep pagination';
  RAISE NOTICE '  - Works well with real-time data updates';
  RAISE NOTICE '';
  RAISE NOTICE 'Next: Update frontend queries to use pagination';
END $$;

-- ---------------------------------------------------------------------------
-- ROLLBACK SCRIPT (save to db/rollbacks/062_rollback.sql)
-- ---------------------------------------------------------------------------
-- DROP VIEW IF EXISTS pagination_statistics;
-- DROP FUNCTION IF EXISTS get_supply_requests_paginated(integer, timestamptz, text);
-- DROP FUNCTION IF EXISTS get_issues_paginated(integer, timestamptz, text, text);
-- DROP FUNCTION IF EXISTS get_pagination_info(text, bigint, integer, text);
-- DROP INDEX IF EXISTS idx_court_sessions_pagination;
-- DROP INDEX IF EXISTS idx_walkthrough_sessions_pagination;
-- DROP INDEX IF EXISTS idx_admin_actions_pagination;
-- DROP INDEX IF EXISTS idx_profiles_pagination;
-- DROP INDEX IF EXISTS idx_supply_requests_pagination;
-- DROP INDEX IF EXISTS idx_issues_pagination;
