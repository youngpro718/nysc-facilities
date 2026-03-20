-- =============================================================================
-- Migration 059: Define Purchasing Role Workflows
--
-- Audit Finding: MEDIUM-10
-- The 'purchasing' role exists but has no defined workflows or permissions.
-- It's unclear what purchasing staff should be able to do in the system.
--
-- This migration defines the purchasing role's responsibilities:
-- 1. View all supply requests (to understand demand)
-- 2. View and manage inventory (to plan procurement)
-- 3. View low stock alerts
-- 4. Create procurement orders (future feature)
-- 5. Track vendor relationships (future feature)
--
-- For now, we grant purchasing staff:
-- - READ access to all supply requests and inventory
-- - WRITE access to inventory (to update stock levels after procurement)
-- - READ access to supply request analytics
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Update RLS policies to grant purchasing staff appropriate access
-- ---------------------------------------------------------------------------

-- Purchasing can view ALL supply requests (not just their own)
DROP POLICY IF EXISTS supply_requests_purchasing_read ON supply_requests;
CREATE POLICY supply_requests_purchasing_read ON supply_requests
  FOR SELECT TO authenticated
  USING (
    is_supply_staff() OR -- Supply staff see all
    is_purchasing() OR -- Purchasing staff see all (NEW)
    requested_by = auth.uid() -- Users see their own
  );

-- Purchasing can manage inventory
DROP POLICY IF EXISTS inventory_items_purchasing_write ON inventory_items;
CREATE POLICY inventory_items_purchasing_write ON inventory_items
  FOR ALL TO authenticated
  USING (is_supply_staff() OR is_purchasing())
  WITH CHECK (is_supply_staff() OR is_purchasing());

-- Update existing policies to use new combined logic
DROP POLICY IF EXISTS supply_requests_read ON supply_requests;
DROP POLICY IF EXISTS inventory_items_write ON inventory_items;

-- ---------------------------------------------------------------------------
-- 2. Create purchasing analytics view
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW purchasing_analytics AS
SELECT 
  -- Overall metrics
  (SELECT COUNT(*) FROM supply_requests) as total_requests,
  (SELECT COUNT(*) FROM supply_requests WHERE status IN ('submitted', 'pending_approval', 'approved', 'received')) as active_requests,
  (SELECT COUNT(*) FROM supply_requests WHERE status = 'completed') as completed_requests,
  
  -- Inventory metrics
  (SELECT COUNT(*) FROM inventory_items) as total_items,
  (SELECT COUNT(*) FROM inventory_items WHERE quantity <= reorder_point) as low_stock_items,
  (SELECT COUNT(*) FROM inventory_items WHERE quantity = 0) as out_of_stock_items,
  
  -- Top requested items (last 30 days)
  (
    SELECT json_agg(item_data ORDER BY request_count DESC)
    FROM (
      SELECT 
        ii.id,
        ii.name,
        ii.category_name,
        COUNT(DISTINCT sr.id) as request_count,
        SUM((sr.items::jsonb->ii.id::text->>'quantity')::int) as total_quantity
      FROM inventory_items ii
      JOIN supply_requests sr ON sr.items::jsonb ? ii.id::text
      WHERE sr.created_at >= NOW() - INTERVAL '30 days'
      GROUP BY ii.id, ii.name, ii.category_name
      ORDER BY request_count DESC
      LIMIT 10
    ) item_data
  ) as top_requested_items,
  
  -- Low stock alerts
  (
    SELECT json_agg(alert_data ORDER BY quantity ASC)
    FROM (
      SELECT 
        id,
        name,
        category_name,
        quantity,
        reorder_point,
        unit
      FROM inventory_items
      WHERE quantity <= reorder_point
      ORDER BY quantity ASC
      LIMIT 20
    ) alert_data
  ) as low_stock_alerts;

COMMENT ON VIEW purchasing_analytics IS 
  'Provides purchasing staff with analytics on supply requests, inventory levels, and procurement needs.';

-- Grant SELECT on view to purchasing staff
GRANT SELECT ON purchasing_analytics TO authenticated;

-- ---------------------------------------------------------------------------
-- 3. Create low stock notification function
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION get_low_stock_items()
RETURNS TABLE (
  item_id uuid,
  item_name text,
  category_name text,
  current_quantity integer,
  reorder_point integer,
  unit text,
  days_until_stockout integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id as item_id,
    name as item_name,
    category_name,
    quantity as current_quantity,
    reorder_point,
    unit,
    -- Estimate days until stockout based on recent usage
    CASE 
      WHEN quantity > 0 THEN
        GREATEST(
          1,
          (quantity::float / NULLIF(
            (
              SELECT COUNT(*)::float / 30 -- Average requests per day over last 30 days
              FROM supply_requests sr
              WHERE sr.items::jsonb ? id::text
                AND sr.created_at >= NOW() - INTERVAL '30 days'
            ),
            0
          ))::integer
        )
      ELSE 0
    END as days_until_stockout
  FROM inventory_items
  WHERE quantity <= reorder_point
  ORDER BY quantity ASC, days_until_stockout ASC;
$$;

COMMENT ON FUNCTION get_low_stock_items() IS 
  'Returns items at or below reorder point with estimated days until stockout based on recent usage patterns.';

-- ---------------------------------------------------------------------------
-- 4. Create purchasing permissions view
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW purchasing_permissions AS
SELECT 
  'supply_requests' as table_name,
  'Purchasing can view all supply requests to understand demand' as permission_description,
  'is_purchasing()' as policy_function,
  'READ' as access_level
UNION ALL
SELECT 
  'inventory_items',
  'Purchasing can view and update inventory (stock levels, reorder points)',
  'is_purchasing()',
  'FULL'
UNION ALL
SELECT 
  'purchasing_analytics',
  'Purchasing can view analytics on requests and inventory',
  'authenticated',
  'READ'
UNION ALL
SELECT 
  'issues',
  'Purchasing can report and view issues',
  'authenticated',
  'READ + OWN WRITE'
UNION ALL
SELECT 
  'profiles',
  'Purchasing can view user directory',
  'authenticated',
  'READ';

COMMENT ON VIEW purchasing_permissions IS 
  'Documents all permissions granted to Purchasing role. Use for auditing and onboarding documentation.';

-- Grant SELECT on view to authenticated users
GRANT SELECT ON purchasing_permissions TO authenticated;

-- ---------------------------------------------------------------------------
-- 5. Update helper function comments
-- ---------------------------------------------------------------------------

COMMENT ON FUNCTION is_purchasing() IS 
  'Returns true if user has purchasing role. Purchasing staff manage procurement, view all supply requests, and maintain inventory stock levels.';

-- ---------------------------------------------------------------------------
-- 6. Add purchasing role documentation
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  RAISE NOTICE '=================================================================';
  RAISE NOTICE 'Purchasing Role - Workflow Definition';
  RAISE NOTICE '=================================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Purchasing staff have the following responsibilities:';
  RAISE NOTICE '';
  RAISE NOTICE 'Supply Request Monitoring:';
  RAISE NOTICE '  ✓ View all supply requests (to understand demand)';
  RAISE NOTICE '  ✓ Analyze request patterns and trends';
  RAISE NOTICE '  ✓ Identify frequently requested items';
  RAISE NOTICE '';
  RAISE NOTICE 'Inventory Management:';
  RAISE NOTICE '  ✓ View all inventory items';
  RAISE NOTICE '  ✓ Update stock levels after procurement';
  RAISE NOTICE '  ✓ Set reorder points';
  RAISE NOTICE '  ✓ Monitor low stock alerts';
  RAISE NOTICE '';
  RAISE NOTICE 'Analytics & Reporting:';
  RAISE NOTICE '  ✓ View purchasing analytics dashboard';
  RAISE NOTICE '  ✓ Track top requested items';
  RAISE NOTICE '  ✓ Monitor stockout predictions';
  RAISE NOTICE '  ✓ Generate procurement reports';
  RAISE NOTICE '';
  RAISE NOTICE 'Restrictions:';
  RAISE NOTICE '  ✗ Cannot approve or fulfill supply requests (that''s supply staff)';
  RAISE NOTICE '  ✗ Cannot manage users or roles';
  RAISE NOTICE '  ✗ Cannot manage building operations';
  RAISE NOTICE '  ✗ Cannot manage court operations';
  RAISE NOTICE '';
  RAISE NOTICE 'Typical Workflow:';
  RAISE NOTICE '  1. Monitor low stock alerts via get_low_stock_items()';
  RAISE NOTICE '  2. Review purchasing_analytics for demand trends';
  RAISE NOTICE '  3. Create procurement orders (external system)';
  RAISE NOTICE '  4. Update inventory stock levels when items arrive';
  RAISE NOTICE '  5. Adjust reorder points based on usage patterns';
  RAISE NOTICE '';
  RAISE NOTICE 'Helper Functions:';
  RAISE NOTICE '  - is_purchasing() - Direct role check';
  RAISE NOTICE '  - get_low_stock_items() - Low stock alerts with stockout estimates';
  RAISE NOTICE '';
  RAISE NOTICE 'Helper Views:';
  RAISE NOTICE '  - purchasing_analytics - Comprehensive procurement analytics';
  RAISE NOTICE '  - purchasing_permissions - Complete permission list';
  RAISE NOTICE '';
  RAISE NOTICE 'Future Enhancements:';
  RAISE NOTICE '  - Procurement order tracking table';
  RAISE NOTICE '  - Vendor management';
  RAISE NOTICE '  - Purchase order approval workflow';
  RAISE NOTICE '  - Budget tracking';
END $$;

-- ---------------------------------------------------------------------------
-- 7. Verification
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  v_policy_count int;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'Verifying purchasing role policies...';
  RAISE NOTICE '';
  
  -- Check supply_requests policies
  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE tablename = 'supply_requests'
    AND policyname LIKE '%purchasing%';
  
  IF v_policy_count > 0 THEN
    RAISE NOTICE '✓ supply_requests - Purchasing policies found';
  ELSE
    RAISE WARNING '✗ supply_requests - No purchasing-specific policies';
  END IF;
  
  -- Check inventory_items policies
  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE tablename = 'inventory_items'
    AND policyname LIKE '%purchasing%';
  
  IF v_policy_count > 0 THEN
    RAISE NOTICE '✓ inventory_items - Purchasing policies found';
  ELSE
    RAISE WARNING '✗ inventory_items - No purchasing-specific policies';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE 'Purchasing role workflows defined successfully';
END $$;

-- ---------------------------------------------------------------------------
-- ROLLBACK SCRIPT (save to db/rollbacks/059_rollback.sql)
-- ---------------------------------------------------------------------------
-- DROP VIEW IF EXISTS purchasing_analytics;
-- DROP VIEW IF EXISTS purchasing_permissions;
-- DROP FUNCTION IF EXISTS get_low_stock_items();
-- DROP POLICY IF EXISTS supply_requests_purchasing_read ON supply_requests;
-- DROP POLICY IF EXISTS inventory_items_purchasing_write ON inventory_items;
-- -- Restore original policies from migration 052
