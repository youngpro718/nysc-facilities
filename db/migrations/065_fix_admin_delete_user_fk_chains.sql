-- Fix admin_delete_user v3: fully explicit statements, no information_schema queries
-- 
-- Root causes fixed across v1-v3:
-- v1: Referenced tables dropped in earlier migrations (occupant_position_history, role_assignments)
-- v2: Removed those references
-- v3: Replaced slow information_schema loops with explicit statements (caused statement timeout)

CREATE OR REPLACE FUNCTION public.admin_delete_user(p_user_id uuid)
RETURNS void
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql AS $$
BEGIN
  -- Security: only admins can call this
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can delete users';
  END IF;

  -- Safety: cannot delete yourself
  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot delete your own account';
  END IF;

  -- Confirm target user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- ============================================================
  -- PHASE 1: Explicit cleanup of tables with FK chains
  -- (children before parents)
  -- ============================================================

  -- occupant_room_assignments (before occupants)
  DELETE FROM public.occupant_room_assignments
  WHERE profile_id = p_user_id
     OR occupant_id IN (SELECT id FROM public.occupants WHERE profile_id = p_user_id);

  -- key_order_items / key_stock_transactions (before key_orders)
  DELETE FROM public.key_order_items
  WHERE order_id IN (
    SELECT id FROM public.key_orders
    WHERE requestor_id = p_user_id OR user_id = p_user_id
       OR ordered_by = p_user_id OR received_by = p_user_id OR delivered_by = p_user_id
       OR recipient_id IN (SELECT id FROM public.occupants WHERE profile_id = p_user_id)
  );
  DELETE FROM public.key_stock_transactions
  WHERE order_id IN (
    SELECT id FROM public.key_orders
    WHERE requestor_id = p_user_id OR user_id = p_user_id
       OR ordered_by = p_user_id OR received_by = p_user_id OR delivered_by = p_user_id
       OR recipient_id IN (SELECT id FROM public.occupants WHERE profile_id = p_user_id)
  );
  DELETE FROM public.key_orders
  WHERE requestor_id = p_user_id OR user_id = p_user_id
     OR ordered_by = p_user_id OR received_by = p_user_id OR delivered_by = p_user_id
     OR recipient_id IN (SELECT id FROM public.occupants WHERE profile_id = p_user_id);

  -- key_assignments (before occupants)
  DELETE FROM public.key_assignments
  WHERE occupant_id IN (SELECT id FROM public.occupants WHERE profile_id = p_user_id)
     OR profile_id = p_user_id;

  -- supply children (before supply_requests)
  DELETE FROM public.supply_request_items
  WHERE request_id IN (SELECT id FROM public.supply_requests WHERE requester_id = p_user_id);
  DELETE FROM public.supply_request_receipts
  WHERE request_id IN (SELECT id FROM public.supply_requests WHERE requester_id = p_user_id);
  DELETE FROM public.supply_request_status_history
  WHERE request_id IN (SELECT id FROM public.supply_requests WHERE requester_id = p_user_id);
  DELETE FROM public.supply_requests WHERE requester_id = p_user_id;

  -- staff_task children (before staff_tasks)
  DELETE FROM public.staff_task_history
  WHERE task_id IN (SELECT id FROM public.staff_tasks WHERE created_by = p_user_id);
  DELETE FROM public.staff_tasks WHERE created_by = p_user_id;

  -- maintenance_project children (before maintenance_projects)
  DELETE FROM public.project_notifications
  WHERE project_id IN (SELECT id FROM public.maintenance_projects WHERE project_manager = p_user_id);
  DELETE FROM public.project_phases
  WHERE project_id IN (SELECT id FROM public.maintenance_projects WHERE project_manager = p_user_id);
  DELETE FROM public.service_impacts
  WHERE project_id IN (SELECT id FROM public.maintenance_projects WHERE project_manager = p_user_id);
  DELETE FROM public.space_impacts
  WHERE project_id IN (SELECT id FROM public.maintenance_projects WHERE project_manager = p_user_id);
  DELETE FROM public.maintenance_projects WHERE project_manager = p_user_id;

  -- Simple owned rows
  DELETE FROM public.user_roles WHERE user_id = p_user_id;
  DELETE FROM public.key_requests WHERE user_id = p_user_id;
  DELETE FROM public.user_notifications WHERE user_id = p_user_id;
  DELETE FROM public.occupants WHERE profile_id = p_user_id;
  DELETE FROM public.user_sessions WHERE user_id = p_user_id;

  -- NOT NULL FK columns referencing auth.users → must delete rows
  DELETE FROM public.backup_retention_policies WHERE created_by = p_user_id;
  DELETE FROM public.backup_versions WHERE created_by = p_user_id;
  DELETE FROM public.form_submissions WHERE uploaded_by = p_user_id;
  DELETE FROM public.walkthrough_sessions WHERE started_by = p_user_id;

  -- ============================================================
  -- PHASE 2: SET NULL on nullable FK columns → profiles(id)
  -- ============================================================
  UPDATE public.access_delegation SET delegate_id = NULL WHERE delegate_id = p_user_id;
  UPDATE public.access_delegation SET delegator_id = NULL WHERE delegator_id = p_user_id;
  UPDATE public.hallways SET inspected_by = NULL WHERE inspected_by = p_user_id;
  UPDATE public.key_management_roles SET profile_id = NULL WHERE profile_id = p_user_id;
  UPDATE public.lighting_fixtures SET last_scheduled_by = NULL WHERE last_scheduled_by = p_user_id;
  UPDATE public.lighting_maintenance SET assigned_technician = NULL WHERE assigned_technician = p_user_id;
  UPDATE public.lighting_maintenance_schedules SET assigned_technician = NULL WHERE assigned_technician = p_user_id;
  UPDATE public.lighting_maintenance_schedules SET completed_by = NULL WHERE completed_by = p_user_id;
  UPDATE public.room_finishes_log SET created_by = NULL WHERE created_by = p_user_id;
  UPDATE public.unified_spaces SET inspected_by = NULL WHERE inspected_by = p_user_id;
  UPDATE public.verification_requests SET approved_by = NULL WHERE approved_by = p_user_id;

  -- ============================================================
  -- PHASE 3: SET NULL on nullable FK columns → auth.users(id)
  -- ============================================================
  UPDATE public.building_activities SET performed_by = NULL WHERE performed_by = p_user_id;
  UPDATE public.court_sessions SET created_by = NULL WHERE created_by = p_user_id;
  UPDATE public.court_sessions SET updated_by = NULL WHERE updated_by = p_user_id;
  UPDATE public.court_terms SET created_by = NULL WHERE created_by = p_user_id;
  UPDATE public.coverage_assignments SET created_by = NULL WHERE created_by = p_user_id;
  UPDATE public.daily_report_notes SET created_by = NULL WHERE created_by = p_user_id;
  UPDATE public.daily_report_notes SET updated_by = NULL WHERE updated_by = p_user_id;
  UPDATE public.fixture_scans SET scanned_by = NULL WHERE scanned_by = p_user_id;
  UPDATE public.floorplans SET last_modified_by = NULL WHERE last_modified_by = p_user_id;
  UPDATE public.form_routing_history SET assigned_to = NULL WHERE assigned_to = p_user_id;
  UPDATE public.form_routing_rules SET assign_to_user_id = NULL WHERE assign_to_user_id = p_user_id;
  UPDATE public.form_routing_rules SET created_by = NULL WHERE created_by = p_user_id;
  UPDATE public.form_submissions SET assigned_to = NULL WHERE assigned_to = p_user_id;
  UPDATE public.form_templates SET created_by = NULL WHERE created_by = p_user_id;
  UPDATE public.issue_history SET performed_by = NULL WHERE performed_by = p_user_id;
  UPDATE public.issues SET assigned_to = NULL WHERE assigned_to = p_user_id;
  UPDATE public.issues SET created_by = NULL WHERE created_by = p_user_id;
  UPDATE public.issues SET external_ticket_entered_by = NULL WHERE external_ticket_entered_by = p_user_id;
  UPDATE public.issues SET reported_by = NULL WHERE reported_by = p_user_id;
  UPDATE public.issues SET resolved_by = NULL WHERE resolved_by = p_user_id;
  UPDATE public.key_audit_logs SET performed_by = NULL WHERE performed_by = p_user_id;
  UPDATE public.key_orders SET delivered_by = NULL WHERE delivered_by = p_user_id;
  UPDATE public.key_orders SET ordered_by = NULL WHERE ordered_by = p_user_id;
  UPDATE public.key_orders SET received_by = NULL WHERE received_by = p_user_id;
  UPDATE public.key_orders SET requestor_id = NULL WHERE requestor_id = p_user_id;
  UPDATE public.key_orders SET user_id = NULL WHERE user_id = p_user_id;
  UPDATE public.key_requests SET approved_by = NULL WHERE approved_by = p_user_id;
  UPDATE public.key_requests SET rejected_by = NULL WHERE rejected_by = p_user_id;
  UPDATE public.key_stock_transactions SET performed_by = NULL WHERE performed_by = p_user_id;
  UPDATE public.lockbox_activity_logs SET actor_user_id = NULL WHERE actor_user_id = p_user_id;
  UPDATE public.maintenance_requests SET assigned_to = NULL WHERE assigned_to = p_user_id;
  UPDATE public.maintenance_requests SET requested_by = NULL WHERE requested_by = p_user_id;
  UPDATE public.maintenance_schedules SET created_by = NULL WHERE created_by = p_user_id;
  UPDATE public.occupant_room_assignments SET created_by = NULL WHERE created_by = p_user_id;
  UPDATE public.occupant_room_assignments SET updated_by = NULL WHERE updated_by = p_user_id;
  UPDATE public.personnel_profiles SET created_by = NULL WHERE created_by = p_user_id;
  UPDATE public.personnel_profiles SET updated_by = NULL WHERE updated_by = p_user_id;
  UPDATE public.profiles SET suspended_by = NULL WHERE suspended_by = p_user_id;
  UPDATE public.backup_restorations SET restored_by = NULL WHERE restored_by = p_user_id;
  UPDATE public.relocation_schedule_changes SET created_by = NULL WHERE created_by = p_user_id;
  UPDATE public.report_templates SET created_by = NULL WHERE created_by = p_user_id;
  UPDATE public.role_audit_log SET target_user_id = NULL WHERE target_user_id = p_user_id;
  UPDATE public.role_audit_log SET user_id = NULL WHERE user_id = p_user_id;
  UPDATE public.room_assignment_audit_log SET performed_by = NULL WHERE performed_by = p_user_id;
  UPDATE public.room_history SET changed_by = NULL WHERE changed_by = p_user_id;
  UPDATE public.room_relocations SET created_by = NULL WHERE created_by = p_user_id;
  UPDATE public.room_shutdowns SET created_by = NULL WHERE created_by = p_user_id;
  UPDATE public.scheduled_reports SET created_by = NULL WHERE created_by = p_user_id;
  UPDATE public.security_audit_log SET user_id = NULL WHERE user_id = p_user_id;
  UPDATE public.security_configurations SET created_by = NULL WHERE created_by = p_user_id;
  UPDATE public.staff_task_history SET performed_by = NULL WHERE performed_by = p_user_id;
  UPDATE public.staff_tasks SET approved_by = NULL WHERE approved_by = p_user_id;
  UPDATE public.staff_tasks SET assigned_to = NULL WHERE assigned_to = p_user_id;
  UPDATE public.staff_tasks SET claimed_by = NULL WHERE claimed_by = p_user_id;
  UPDATE public.staff_tasks SET requested_by = NULL WHERE requested_by = p_user_id;
  UPDATE public.supply_request_receipts SET generated_by = NULL WHERE generated_by = p_user_id;
  UPDATE public.supply_request_status_history SET changed_by = NULL WHERE changed_by = p_user_id;
  UPDATE public.supply_requests SET approved_by = NULL WHERE approved_by = p_user_id;
  UPDATE public.supply_requests SET fulfilled_by = NULL WHERE fulfilled_by = p_user_id;
  UPDATE public.user_sessions SET user_id = NULL WHERE user_id = p_user_id;
  UPDATE public.verification_requests SET user_id = NULL WHERE user_id = p_user_id;
  UPDATE auth.oauth_authorizations SET user_id = NULL WHERE user_id = p_user_id;
  UPDATE auth.webauthn_challenges SET user_id = NULL WHERE user_id = p_user_id;

  -- ============================================================
  -- PHASE 4: Delete profile row
  -- ============================================================
  DELETE FROM public.profiles WHERE id = p_user_id;

  -- ============================================================
  -- PHASE 5: Delete auth.users row and its auth children
  -- ============================================================
  DELETE FROM auth.identities WHERE user_id = p_user_id;
  DELETE FROM auth.mfa_factors WHERE user_id = p_user_id;
  DELETE FROM auth.oauth_consents WHERE user_id = p_user_id;
  DELETE FROM auth.one_time_tokens WHERE user_id = p_user_id;
  DELETE FROM auth.sessions WHERE user_id = p_user_id;
  DELETE FROM auth.webauthn_credentials WHERE user_id = p_user_id;
  DELETE FROM auth.users WHERE id = p_user_id;
END;
$$;
