-- db/migrations/024_admin_delete_user.sql
-- Create a SECURITY DEFINER function for admin user deletion.
-- This properly cleans up all related records and the auth.users entry.
-- Client-side direct deletes fail due to RLS policies only allowing 'coordinator' role.

-- Also fixes the log_room_assignment_changes trigger which was using invalid
-- action_type values ('removed' instead of 'deleted', 'created'/'updated' are valid).

-- Fix the occupant_room_assignments audit trigger (was using invalid enum values)
CREATE OR REPLACE FUNCTION public.log_room_assignment_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_user_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_user_id := OLD.profile_id;
  ELSE
    target_user_id := NEW.profile_id;
  END IF;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.room_assignment_audit_log (
      assignment_id, action_type, performed_by, new_values
    ) VALUES (
      NEW.id, 'created', auth.uid(), row_to_json(NEW)::jsonb
    );

    IF target_user_id IS NOT NULL THEN
      INSERT INTO user_notifications (
        user_id, type, title, message, urgency, action_url, related_id, metadata
      ) VALUES (
        target_user_id, 'new_assignment', 'New Room Assignment',
        'You have been assigned to ' ||
        COALESCE((SELECT room_number FROM rooms WHERE id = NEW.room_id), 'a room') ||
        CASE WHEN NEW.is_primary THEN ' as your primary office'
             ELSE ' (' || COALESCE(NEW.assignment_type, 'assignment') || ')' END,
        CASE WHEN NEW.is_primary THEN 'high' ELSE 'medium' END,
        '/dashboard', NEW.id,
        jsonb_build_object('assignment_id', NEW.id, 'room_id', NEW.room_id,
                           'assignment_type', NEW.assignment_type, 'is_primary', NEW.is_primary)
      );
    END IF;
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    target_user_id := NEW.profile_id;

    INSERT INTO public.room_assignment_audit_log (
      assignment_id, action_type, performed_by, old_values, new_values
    ) VALUES (
      NEW.id,
      CASE WHEN NEW.expiration_date IS DISTINCT FROM OLD.expiration_date
            AND NEW.expiration_date > now() THEN 'renewed' ELSE 'updated' END,
      auth.uid(), row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb
    );

    IF target_user_id IS NOT NULL AND
       (OLD.room_id IS DISTINCT FROM NEW.room_id OR OLD.is_primary IS DISTINCT FROM NEW.is_primary) THEN
      INSERT INTO user_notifications (
        user_id, type, title, message, urgency, action_url, related_id, metadata
      ) VALUES (
        target_user_id, 'new_assignment', 'Room Assignment Updated',
        'Your room assignment has been updated to ' ||
        COALESCE((SELECT room_number FROM rooms WHERE id = NEW.room_id), 'a room') ||
        CASE WHEN NEW.is_primary THEN ' as your primary office'
             ELSE ' (' || COALESCE(NEW.assignment_type, 'assignment') || ')' END,
        'medium', '/dashboard', NEW.id,
        jsonb_build_object('assignment_id', NEW.id, 'room_id', NEW.room_id,
                           'assignment_type', NEW.assignment_type, 'is_primary', NEW.is_primary,
                           'previous_room_id', OLD.room_id)
      );
    END IF;
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.room_assignment_audit_log (
      assignment_id, action_type, performed_by, old_values
    ) VALUES (
      OLD.id, 'deleted', auth.uid(), row_to_json(OLD)::jsonb
    );

    -- Only notify if user profile still exists (avoid FK violation during cascade delete)
    IF target_user_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.profiles WHERE id = target_user_id) THEN
      INSERT INTO user_notifications (
        user_id, type, title, message, urgency, action_url, metadata
      ) VALUES (
        target_user_id, 'new_assignment', 'Room Assignment Removed',
        'Your assignment to ' ||
        COALESCE((SELECT room_number FROM rooms WHERE id = OLD.room_id), 'a room') ||
        ' has been removed',
        'medium', '/dashboard',
        jsonb_build_object('assignment_id', OLD.id, 'room_id', OLD.room_id,
                           'assignment_type', OLD.assignment_type)
      );
    END IF;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

-- Admin delete user function
CREATE OR REPLACE FUNCTION public.admin_delete_user(p_user_id uuid)
RETURNS void
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql AS $$
DECLARE
  r RECORD;
BEGIN
  -- Security: only admins can call this (role is in user_roles table)
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

  -- Step 1: occupant_room_assignments
  -- Trigger uses 'deleted' (valid value in check constraint) — safe to fire
  DELETE FROM public.occupant_room_assignments
  WHERE profile_id = p_user_id
     OR occupant_id IN (SELECT id FROM public.occupants WHERE profile_id = p_user_id);

  -- Step 2: key_order_items and key_stock_transactions before key_orders
  -- key_orders has multiple FK cols pointing to profiles: requestor_id, user_id, ordered_by, received_by, delivered_by
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

  -- Step 3: key_orders
  DELETE FROM public.key_orders
  WHERE requestor_id = p_user_id OR user_id = p_user_id
     OR ordered_by = p_user_id OR received_by = p_user_id OR delivered_by = p_user_id
     OR recipient_id IN (SELECT id FROM public.occupants WHERE profile_id = p_user_id);

  -- Step 4: key_assignments (RESTRICT on occupants — must precede occupants delete)
  DELETE FROM public.key_assignments
  WHERE occupant_id IN (SELECT id FROM public.occupants WHERE profile_id = p_user_id)
     OR profile_id = p_user_id;

  -- Step 5: occupant_position_history
  DELETE FROM public.occupant_position_history
  WHERE occupant_id IN (SELECT id FROM public.occupants WHERE profile_id = p_user_id)
     OR supervisor_id IN (SELECT id FROM public.occupants WHERE profile_id = p_user_id);

  -- Step 6: role tables
  DELETE FROM public.user_roles WHERE user_id = p_user_id;
  DELETE FROM public.role_assignments WHERE profile_id = p_user_id;

  -- Step 7: key_requests / user_notifications
  DELETE FROM public.key_requests WHERE user_id = p_user_id;
  DELETE FROM public.user_notifications WHERE user_id = p_user_id;

  -- Step 8: occupants
  DELETE FROM public.occupants WHERE profile_id = p_user_id;

  -- Step 9: Generic loop — delete any remaining rows referencing profiles(id)
  FOR r IN
    SELECT DISTINCT
      kcu.table_schema AS tschema,
      kcu.table_name   AS tname,
      kcu.column_name  AS cname
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
     AND tc.table_schema    = kcu.table_schema
    JOIN information_schema.referential_constraints AS rc
      ON tc.constraint_name  = rc.constraint_name
     AND tc.table_schema     = rc.constraint_schema
    JOIN information_schema.key_column_usage AS ccu
      ON ccu.constraint_name = rc.unique_constraint_name
     AND ccu.table_schema    = rc.unique_constraint_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND ccu.table_schema   = 'public'
      AND ccu.table_name     = 'profiles'
      AND ccu.column_name    = 'id'
      AND kcu.table_name NOT IN (
        'occupant_room_assignments', 'key_requests', 'user_notifications',
        'occupants', 'key_orders', 'key_assignments', 'user_roles',
        'role_assignments', 'profiles'
      )
  LOOP
    EXECUTE format(
      'DELETE FROM %I.%I WHERE %I = $1',
      r.tschema, r.tname, r.cname
    ) USING p_user_id;
  END LOOP;

  -- Step 10: Delete profile
  DELETE FROM public.profiles WHERE id = p_user_id;

  -- Step 11: Generic loop — delete any remaining rows referencing auth.users(id)
  FOR r IN
    SELECT DISTINCT
      kcu.table_schema AS tschema,
      kcu.table_name   AS tname,
      kcu.column_name  AS cname
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
     AND tc.table_schema    = kcu.table_schema
    JOIN information_schema.referential_constraints AS rc
      ON tc.constraint_name  = rc.constraint_name
     AND tc.table_schema     = rc.constraint_schema
    JOIN information_schema.key_column_usage AS ccu
      ON ccu.constraint_name = rc.unique_constraint_name
     AND ccu.table_schema    = rc.unique_constraint_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND ccu.table_schema   = 'auth'
      AND ccu.table_name     = 'users'
      AND ccu.column_name    = 'id'
  LOOP
    EXECUTE format(
      'DELETE FROM %I.%I WHERE %I = $1',
      r.tschema, r.tname, r.cname
    ) USING p_user_id;
  END LOOP;

  -- Step 12: Delete auth.users entry
  DELETE FROM auth.users WHERE id = p_user_id;

END;
$$;
