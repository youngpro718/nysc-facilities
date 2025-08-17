-- Comprehensive admin notification triggers across core tables
-- Uses to_jsonb(NEW/OLD)->> access to avoid hard dependencies on column existence

BEGIN;

-- ========== PROFILES: approval/rejection on update ==========
DROP TRIGGER IF EXISTS trg_emit_profile_approval_change ON public.profiles;
DROP FUNCTION IF EXISTS public.trg_emit_profile_approval_change();
CREATE OR REPLACE FUNCTION public.trg_emit_profile_approval_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'pg_catalog', 'public'
AS $$
DECLARE
  v_old_approved text := to_jsonb(OLD)->>'is_approved';
  v_new_approved text := to_jsonb(NEW)->>'is_approved';
  v_title text;
  v_message text;
  v_type text;
BEGIN
  IF TG_OP = 'UPDATE' AND v_old_approved IS DISTINCT FROM v_new_approved THEN
    IF v_new_approved = 'true' THEN
      v_type := 'user_approved';
      v_title := 'User approved';
      v_message := 'User ' || COALESCE(NEW.email, NEW.id::text) || ' was approved.';
    ELSE
      v_type := 'user_rejected';
      v_title := 'User rejected';
      v_message := 'User ' || COALESCE(NEW.email, NEW.id::text) || ' was rejected.';
    END IF;

    PERFORM public.emit_admin_notification(
      p_type => v_type,
      p_title => v_title,
      p_message => v_message,
      p_urgency => 'medium',
      p_related_table => 'profiles',
      p_related_id => NEW.id,
      p_metadata => jsonb_build_object(
        'target_user_id', NEW.id,
        'email', NEW.email,
        'action_url', '/admin'
      )
    );
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_emit_profile_approval_change
AFTER UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.trg_emit_profile_approval_change();

-- ========== USER ROLES: assign/remove/change ==========
DROP TRIGGER IF EXISTS trg_emit_role_assigned ON public.user_roles;
DROP TRIGGER IF EXISTS trg_emit_role_removed ON public.user_roles;
DROP TRIGGER IF EXISTS trg_emit_role_changed ON public.user_roles;
DROP FUNCTION IF EXISTS public.trg_emit_role_assigned();
DROP FUNCTION IF EXISTS public.trg_emit_role_removed();
DROP FUNCTION IF EXISTS public.trg_emit_role_changed();

CREATE OR REPLACE FUNCTION public.trg_emit_role_assigned()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'pg_catalog','public'
AS $$
BEGIN
  PERFORM public.emit_admin_notification(
    'role_assigned',
    'Role assigned',
    'Role ' || COALESCE(NEW.role,'') || ' assigned to user ' || NEW.user_id::text,
    'medium',
    'user_roles',
    NEW.user_id,
    jsonb_build_object('user_id', NEW.user_id, 'role', NEW.role, 'action_url', '/admin')
  );
  RETURN NEW;
END;$$;

CREATE OR REPLACE FUNCTION public.trg_emit_role_removed()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'pg_catalog','public'
AS $$
BEGIN
  PERFORM public.emit_admin_notification(
    'role_removed',
    'Role removed',
    'Role ' || COALESCE(OLD.role,'') || ' removed from user ' || OLD.user_id::text,
    'medium',
    'user_roles',
    OLD.user_id,
    jsonb_build_object('user_id', OLD.user_id, 'role', OLD.role, 'action_url', '/admin')
  );
  RETURN OLD;
END;$$;

CREATE OR REPLACE FUNCTION public.trg_emit_role_changed()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'pg_catalog','public'
AS $$
DECLARE
  v_old_role text := to_jsonb(OLD)->>'role';
  v_new_role text := to_jsonb(NEW)->>'role';
BEGIN
  IF v_old_role IS DISTINCT FROM v_new_role THEN
    PERFORM public.emit_admin_notification(
      'role_changed',
      'Role changed',
      'User ' || NEW.user_id::text || ' role changed from ' || COALESCE(v_old_role,'(none)') || ' to ' || COALESCE(v_new_role,'(none)'),
      'medium',
      'user_roles',
      NEW.user_id,
      jsonb_build_object('user_id', NEW.user_id, 'old_role', v_old_role, 'new_role', v_new_role, 'action_url', '/admin')
    );
  END IF;
  RETURN NEW;
END;$$;

CREATE TRIGGER trg_emit_role_assigned
AFTER INSERT ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.trg_emit_role_assigned();

CREATE TRIGGER trg_emit_role_removed
AFTER DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.trg_emit_role_removed();

CREATE TRIGGER trg_emit_role_changed
AFTER UPDATE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.trg_emit_role_changed();

-- Helper to create generic status/priority/assignee triggers for a table
-- table_name should be one of: issues, key_requests, supply_requests, key_orders
-- We implement explicit functions per table to keep SECURITY DEFINER simple

-- ========== ISSUES ==========
DROP TRIGGER IF EXISTS trg_emit_issue_updates ON public.issues;
DROP FUNCTION IF EXISTS public.trg_emit_issue_updates();
CREATE OR REPLACE FUNCTION public.trg_emit_issue_updates()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='pg_catalog','public'
AS $$
DECLARE
  v_old jsonb := to_jsonb(OLD);
  v_new jsonb := to_jsonb(NEW);
  v_changed boolean := false;
BEGIN
  -- status change
  IF v_old->>'status' IS DISTINCT FROM v_new->>'status' THEN
    v_changed := true;
    PERFORM public.emit_admin_notification(
      'issue_status_change',
      'Issue status updated',
      'Issue status changed from '||COALESCE(v_old->>'status','(none)')||' to '||COALESCE(v_new->>'status','(none)'),
      'medium', 'issues', NEW.id,
      jsonb_build_object('old', v_old->>'status','new', v_new->>'status','action_url','/admin/issues')
    );
  END IF;
  -- priority change
  IF v_old->>'priority' IS DISTINCT FROM v_new->>'priority' THEN
    v_changed := true;
    PERFORM public.emit_admin_notification(
      'issue_priority_change',
      'Issue priority updated',
      'Issue priority changed from '||COALESCE(v_old->>'priority','(none)')||' to '||COALESCE(v_new->>'priority','(none)'),
      CASE WHEN COALESCE(v_new->>'priority','') IN ('critical','urgent','high') THEN 'high' ELSE 'medium' END,
      'issues', NEW.id,
      jsonb_build_object('old', v_old->>'priority','new', v_new->>'priority','action_url','/admin/issues')
    );
  END IF;
  -- assigned change
  IF v_old->>'assigned_to' IS DISTINCT FROM v_new->>'assigned_to' THEN
    v_changed := true;
    PERFORM public.emit_admin_notification(
      'issue_assigned',
      'Issue assignment updated',
      'Issue assigned changed',
      'low', 'issues', NEW.id,
      jsonb_build_object('old', v_old->>'assigned_to','new', v_new->>'assigned_to','action_url','/admin/issues')
    );
  END IF;
  IF NOT v_changed THEN
    RETURN NEW;
  END IF;
  RETURN NEW;
END;$$;
CREATE TRIGGER trg_emit_issue_updates
AFTER UPDATE ON public.issues
FOR EACH ROW EXECUTE FUNCTION public.trg_emit_issue_updates();

-- ========== KEY REQUESTS ==========
DROP TRIGGER IF EXISTS trg_emit_key_request_updates ON public.key_requests;
DROP FUNCTION IF EXISTS public.trg_emit_key_request_updates();
CREATE OR REPLACE FUNCTION public.trg_emit_key_request_updates()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='pg_catalog','public'
AS $$
DECLARE
  v_old jsonb := to_jsonb(OLD);
  v_new jsonb := to_jsonb(NEW);
BEGIN
  IF v_old->>'status' IS DISTINCT FROM v_new->>'status' THEN
    PERFORM public.emit_admin_notification(
      'key_request_status_change',
      'Key request status updated',
      'Key request status changed from '||COALESCE(v_old->>'status','(none)')||' to '||COALESCE(v_new->>'status','(none)'),
      'medium', 'key_requests', NEW.id,
      jsonb_build_object('old', v_old->>'status','new', v_new->>'status','action_url','/admin/key-requests')
    );
  END IF;
  IF v_old->>'priority' IS DISTINCT FROM v_new->>'priority' THEN
    PERFORM public.emit_admin_notification(
      'key_request_priority_change',
      'Key request priority updated',
      'Priority changed from '||COALESCE(v_old->>'priority','(none)')||' to '||COALESCE(v_new->>'priority','(none)'),
      CASE WHEN COALESCE(v_new->>'priority','') IN ('critical','urgent','high') THEN 'high' ELSE 'medium' END,
      'key_requests', NEW.id,
      jsonb_build_object('old', v_old->>'priority','new', v_new->>'priority','action_url','/admin/key-requests')
    );
  END IF;
  IF v_old->>'assigned_to' IS DISTINCT FROM v_new->>'assigned_to' THEN
    PERFORM public.emit_admin_notification(
      'key_request_assigned',
      'Key request assignment updated',
      'Assignee changed',
      'low', 'key_requests', NEW.id,
      jsonb_build_object('old', v_old->>'assigned_to','new', v_new->>'assigned_to','action_url','/admin/key-requests')
    );
  END IF;
  RETURN NEW;
END;$$;
CREATE TRIGGER trg_emit_key_request_updates
AFTER UPDATE ON public.key_requests
FOR EACH ROW EXECUTE FUNCTION public.trg_emit_key_request_updates();

-- ========== SUPPLY REQUESTS ==========
DROP TRIGGER IF EXISTS trg_emit_supply_request_updates ON public.supply_requests;
DROP FUNCTION IF EXISTS public.trg_emit_supply_request_updates();
CREATE OR REPLACE FUNCTION public.trg_emit_supply_request_updates()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='pg_catalog','public'
AS $$
DECLARE
  v_old jsonb := to_jsonb(OLD);
  v_new jsonb := to_jsonb(NEW);
BEGIN
  IF v_old->>'status' IS DISTINCT FROM v_new->>'status' THEN
    PERFORM public.emit_admin_notification(
      'supply_request_status_change',
      'Supply request status updated',
      'Status changed from '||COALESCE(v_old->>'status','(none)')||' to '||COALESCE(v_new->>'status','(none)'),
      'medium', 'supply_requests', NEW.id,
      jsonb_build_object('old', v_old->>'status','new', v_new->>'status','action_url','/admin/supply-requests')
    );
  END IF;
  IF v_old->>'priority' IS DISTINCT FROM v_new->>'priority' THEN
    PERFORM public.emit_admin_notification(
      'supply_request_priority_change',
      'Supply request priority updated',
      'Priority changed from '||COALESCE(v_old->>'priority','(none)')||' to '||COALESCE(v_new->>'priority','(none)'),
      CASE WHEN COALESCE(v_new->>'priority','') IN ('critical','urgent','high') THEN 'high' ELSE 'medium' END,
      'supply_requests', NEW.id,
      jsonb_build_object('old', v_old->>'priority','new', v_new->>'priority','action_url','/admin/supply-requests')
    );
  END IF;
  IF v_old->>'assigned_to' IS DISTINCT FROM v_new->>'assigned_to' THEN
    PERFORM public.emit_admin_notification(
      'supply_request_assigned',
      'Supply request assignment updated',
      'Assignee changed',
      'low', 'supply_requests', NEW.id,
      jsonb_build_object('old', v_old->>'assigned_to','new', v_new->>'assigned_to','action_url','/admin/supply-requests')
    );
  END IF;
  RETURN NEW;
END;$$;
CREATE TRIGGER trg_emit_supply_request_updates
AFTER UPDATE ON public.supply_requests
FOR EACH ROW EXECUTE FUNCTION public.trg_emit_supply_request_updates();

-- ========== KEY ORDERS ==========
DROP TRIGGER IF EXISTS trg_emit_key_order_updates ON public.key_orders;
DROP FUNCTION IF EXISTS public.trg_emit_key_order_updates();
CREATE OR REPLACE FUNCTION public.trg_emit_key_order_updates()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='pg_catalog','public'
AS $$
DECLARE
  v_old jsonb := to_jsonb(OLD);
  v_new jsonb := to_jsonb(NEW);
BEGIN
  IF v_old->>'status' IS DISTINCT FROM v_new->>'status' THEN
    PERFORM public.emit_admin_notification(
      'key_order_status_change',
      'Key order status updated',
      'Status changed from '||COALESCE(v_old->>'status','(none)')||' to '||COALESCE(v_new->>'status','(none)'),
      'medium', 'key_orders', NEW.id,
      jsonb_build_object('old', v_old->>'status','new', v_new->>'status','action_url','/admin/key-orders')
    );
  END IF;
  RETURN NEW;
END;$$;
CREATE TRIGGER trg_emit_key_order_updates
AFTER UPDATE ON public.key_orders
FOR EACH ROW EXECUTE FUNCTION public.trg_emit_key_order_updates();

COMMIT;
