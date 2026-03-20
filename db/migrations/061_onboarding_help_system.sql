-- =============================================================================
-- Migration 061: Onboarding Improvements and Help System
--
-- Audit Findings: MEDIUM-14, MEDIUM-15
-- - New users struggle with unclear onboarding flow
-- - No in-app help or documentation for features
-- - Users don't understand their role permissions
--
-- This migration creates:
-- 1. Onboarding checklist system
-- 2. Contextual help content table
-- 3. Role-specific getting started guides
-- 4. Feature tour tracking
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Create onboarding_checklist table
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS onboarding_checklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  step_key text NOT NULL,
  step_title text NOT NULL,
  step_description text,
  completed boolean DEFAULT false NOT NULL,
  completed_at timestamptz,
  step_order integer NOT NULL,
  role_specific text, -- Which role this step applies to (NULL = all roles)
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, step_key)
);

CREATE INDEX idx_onboarding_checklist_user_id ON onboarding_checklist(user_id);
CREATE INDEX idx_onboarding_checklist_completed ON onboarding_checklist(user_id, completed);

-- ---------------------------------------------------------------------------
-- 2. Create help_content table
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS help_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_key text UNIQUE NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  category text NOT NULL, -- 'feature', 'role', 'workflow', 'troubleshooting'
  role_specific text, -- Which role this help applies to (NULL = all roles)
  related_feature text, -- Which feature/module this relates to
  search_keywords text[], -- For search functionality
  view_count integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_help_content_category ON help_content(category);
CREATE INDEX idx_help_content_role ON help_content(role_specific);
CREATE INDEX idx_help_content_feature ON help_content(related_feature);
CREATE INDEX idx_help_content_search ON help_content USING gin(search_keywords);

-- ---------------------------------------------------------------------------
-- 3. Create feature_tours table
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS feature_tours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tour_key text NOT NULL,
  tour_name text NOT NULL,
  completed boolean DEFAULT false NOT NULL,
  completed_at timestamptz,
  dismissed boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, tour_key)
);

CREATE INDEX idx_feature_tours_user_id ON feature_tours(user_id);

-- ---------------------------------------------------------------------------
-- 4. Enable RLS
-- ---------------------------------------------------------------------------

ALTER TABLE onboarding_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE help_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_tours ENABLE ROW LEVEL SECURITY;

-- Users can view and update their own checklist
CREATE POLICY onboarding_checklist_own ON onboarding_checklist
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- All users can read help content
CREATE POLICY help_content_read ON help_content
  FOR SELECT TO authenticated
  USING (true);

-- Admins can manage help content
CREATE POLICY help_content_admin_write ON help_content
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Users can manage their own feature tours
CREATE POLICY feature_tours_own ON feature_tours
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 5. Add updated_at triggers
-- ---------------------------------------------------------------------------

CREATE TRIGGER trg_onboarding_checklist_updated_at
  BEFORE UPDATE ON onboarding_checklist
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_help_content_updated_at
  BEFORE UPDATE ON help_content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_feature_tours_updated_at
  BEFORE UPDATE ON feature_tours
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- 6. Create function to initialize user onboarding checklist
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION initialize_onboarding_checklist(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  -- Get user's role
  SELECT role INTO v_role
  FROM user_roles
  WHERE user_id = p_user_id;
  
  -- Insert common onboarding steps
  INSERT INTO onboarding_checklist (user_id, step_key, step_title, step_description, step_order)
  VALUES
    (p_user_id, 'complete_profile', 'Complete Your Profile', 'Add your name, title, and contact information', 1),
    (p_user_id, 'explore_dashboard', 'Explore Your Dashboard', 'Familiarize yourself with your personalized dashboard', 2),
    (p_user_id, 'understand_permissions', 'Understand Your Permissions', 'Learn what you can do with your role', 3)
  ON CONFLICT (user_id, step_key) DO NOTHING;
  
  -- Add role-specific steps
  IF v_role = 'court_aide' THEN
    INSERT INTO onboarding_checklist (user_id, step_key, step_title, step_description, step_order, role_specific)
    VALUES
      (p_user_id, 'manage_inventory', 'Manage Inventory', 'Learn how to update stock levels and fulfill requests', 4, 'court_aide'),
      (p_user_id, 'fulfill_request', 'Fulfill Your First Request', 'Process a supply request from start to finish', 5, 'court_aide')
    ON CONFLICT (user_id, step_key) DO NOTHING;
    
  ELSIF v_role = 'court_officer' THEN
    INSERT INTO onboarding_checklist (user_id, step_key, step_title, step_description, step_order, role_specific)
    VALUES
      (p_user_id, 'lighting_walkthrough', 'Complete a Lighting Walkthrough', 'Learn how to conduct lighting inspections', 4, 'court_officer'),
      (p_user_id, 'assign_keys', 'Assign Keys', 'Learn how to manage key assignments', 5, 'court_officer')
    ON CONFLICT (user_id, step_key) DO NOTHING;
    
  ELSIF v_role = 'cmc' THEN
    INSERT INTO onboarding_checklist (user_id, step_key, step_title, step_description, step_order, role_specific)
    VALUES
      (p_user_id, 'schedule_session', 'Schedule a Court Session', 'Learn how to create and manage court sessions', 4, 'cmc'),
      (p_user_id, 'view_courtrooms', 'View Courtroom Status', 'Check courtroom availability and health', 5, 'cmc')
    ON CONFLICT (user_id, step_key) DO NOTHING;
    
  ELSIF v_role = 'purchasing' THEN
    INSERT INTO onboarding_checklist (user_id, step_key, step_title, step_description, step_order, role_specific)
    VALUES
      (p_user_id, 'review_analytics', 'Review Purchasing Analytics', 'Understand demand trends and low stock alerts', 4, 'purchasing'),
      (p_user_id, 'update_inventory', 'Update Inventory Levels', 'Learn how to update stock after procurement', 5, 'purchasing')
    ON CONFLICT (user_id, step_key) DO NOTHING;
    
  ELSIF v_role = 'facilities_manager' THEN
    INSERT INTO onboarding_checklist (user_id, step_key, step_title, step_description, step_order, role_specific)
    VALUES
      (p_user_id, 'manage_spaces', 'Manage Spatial Catalog', 'Learn how to update buildings, floors, and rooms', 4, 'facilities_manager'),
      (p_user_id, 'review_issues', 'Review Facility Issues', 'Learn how to triage and assign maintenance issues', 5, 'facilities_manager')
    ON CONFLICT (user_id, step_key) DO NOTHING;
  END IF;
END;
$$;

COMMENT ON FUNCTION initialize_onboarding_checklist(uuid) IS 
  'Initializes role-specific onboarding checklist for a user.';

-- ---------------------------------------------------------------------------
-- 7. Create function to mark checklist step complete
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION complete_onboarding_step(p_step_key text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE onboarding_checklist
  SET 
    completed = true,
    completed_at = NOW()
  WHERE user_id = auth.uid()
    AND step_key = p_step_key
    AND completed = false;
END;
$$;

COMMENT ON FUNCTION complete_onboarding_step(text) IS 
  'Marks an onboarding step as complete for the current user.';

-- ---------------------------------------------------------------------------
-- 8. Seed initial help content
-- ---------------------------------------------------------------------------

INSERT INTO help_content (content_key, title, content, category, role_specific, related_feature, search_keywords) VALUES
  -- General help
  ('getting_started', 'Getting Started', 'Welcome to the NYSC Facilities Management System! This guide will help you get started with the basics.', 'feature', NULL, 'dashboard', ARRAY['start', 'begin', 'intro', 'welcome']),
  
  -- Role-specific guides
  ('court_aide_guide', 'Court Aide Guide', 'As a Court Aide, you manage supply operations including inventory, fulfilling requests, and tracking stock levels.', 'role', 'court_aide', 'supply', ARRAY['supply', 'inventory', 'aide']),
  ('court_officer_guide', 'Court Officer Guide', 'As a Court Officer, you manage building operations including lighting walkthroughs, key assignments, and facility maintenance.', 'role', 'court_officer', 'lighting', ARRAY['officer', 'lighting', 'keys', 'building']),
  ('cmc_guide', 'CMC Guide', 'As a Court Management Coordinator, you manage court operations including scheduling sessions, managing terms, and coordinating courtroom usage.', 'role', 'cmc', 'court', ARRAY['cmc', 'court', 'sessions', 'coordinator']),
  ('purchasing_guide', 'Purchasing Guide', 'As a Purchasing staff member, you monitor supply demand, manage procurement, and maintain inventory stock levels.', 'role', 'purchasing', 'supply', ARRAY['purchasing', 'procurement', 'analytics']),
  ('facilities_manager_guide', 'Facilities Manager Guide', 'As a Facilities Manager, you oversee the spatial catalog, manage building operations, and coordinate maintenance activities.', 'role', 'facilities_manager', 'spaces', ARRAY['facilities', 'manager', 'buildings', 'spaces']),
  
  -- Feature guides
  ('supply_requests', 'Supply Requests', 'Learn how to submit, track, and manage supply requests through the system.', 'feature', NULL, 'supply', ARRAY['supply', 'request', 'order']),
  ('lighting_walkthroughs', 'Lighting Walkthroughs', 'Learn how to conduct lighting inspections and record fixture status.', 'feature', 'court_officer', 'lighting', ARRAY['lighting', 'walkthrough', 'inspection']),
  ('key_management', 'Key Management', 'Learn how to assign, track, and manage building keys.', 'feature', 'court_officer', 'keys', ARRAY['keys', 'assign', 'track']),
  ('court_sessions', 'Court Sessions', 'Learn how to schedule and manage court sessions.', 'feature', 'cmc', 'court', ARRAY['sessions', 'schedule', 'court'])
ON CONFLICT (content_key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 9. Create function to track help content views
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION track_help_view(p_content_key text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE help_content
  SET view_count = view_count + 1
  WHERE content_key = p_content_key;
END;
$$;

COMMENT ON FUNCTION track_help_view(text) IS 
  'Increments view count for help content (for analytics).';

-- ---------------------------------------------------------------------------
-- 10. Verification
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  RAISE NOTICE '=================================================================';
  RAISE NOTICE 'Onboarding & Help System - Installation Complete';
  RAISE NOTICE '=================================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Tables created:';
  RAISE NOTICE '  ✓ onboarding_checklist - Role-specific onboarding steps';
  RAISE NOTICE '  ✓ help_content - Contextual help and documentation';
  RAISE NOTICE '  ✓ feature_tours - Feature tour tracking';
  RAISE NOTICE '';
  RAISE NOTICE 'Functions created:';
  RAISE NOTICE '  ✓ initialize_onboarding_checklist(user_id)';
  RAISE NOTICE '  ✓ complete_onboarding_step(step_key)';
  RAISE NOTICE '  ✓ track_help_view(content_key)';
  RAISE NOTICE '';
  RAISE NOTICE 'Help content seeded:';
  RAISE NOTICE '  - General getting started guide';
  RAISE NOTICE '  - 5 role-specific guides';
  RAISE NOTICE '  - 4 feature guides';
  RAISE NOTICE '';
  RAISE NOTICE 'Next: Build frontend components for onboarding checklist and help system';
END $$;

-- ---------------------------------------------------------------------------
-- ROLLBACK SCRIPT (save to db/rollbacks/061_rollback.sql)
-- ---------------------------------------------------------------------------
-- DROP FUNCTION IF EXISTS track_help_view(text);
-- DROP FUNCTION IF EXISTS complete_onboarding_step(text);
-- DROP FUNCTION IF EXISTS initialize_onboarding_checklist(uuid);
-- DROP TABLE IF EXISTS feature_tours;
-- DROP TABLE IF EXISTS help_content;
-- DROP TABLE IF EXISTS onboarding_checklist;
