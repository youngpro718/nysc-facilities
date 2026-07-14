-- =============================================================================
-- Migration 107: Audit log for inventory_items and rooms edits/deletes
--
-- Problem: nothing in the app tracks who changed or deleted an inventory
-- item or a room, beyond quantity-only adjustments in
-- inventory_item_transactions (written by app code, never for name/
-- description/category/storage_room_id/etc, and never on delete).
-- InventoryItemsPanel's delete path even hard-deletes rows outright, leaving
-- zero trace. Recent Activity on the admin dashboard only ever queries
-- issues and supply_requests, so none of this ever surfaces.
--
-- Fix: reuse the existing generic audit_logs table (table_name, record_id,
-- action, old_values, new_values, performed_by, performed_at) — already
-- used for profile actions, unused for inventory_items/rooms — and add
-- AFTER INSERT/UPDATE/DELETE triggers on both tables, modeled on
-- track_issue_history_trigger (migration 066). Trigger-based (not app-level
-- calls) so it catches every write path, including direct SQL and any
-- future UI, and captures hard deletes via OLD in the AFTER DELETE trigger.
-- =============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.log_inventory_items_audit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, performed_by, performed_at)
    VALUES ('inventory_items', NEW.id::text, 'insert', NULL, to_jsonb(NEW), auth.uid(), now());
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, performed_by, performed_at)
    VALUES ('inventory_items', NEW.id::text, 'update', to_jsonb(OLD), to_jsonb(NEW), auth.uid(), now());
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, performed_by, performed_at)
    VALUES ('inventory_items', OLD.id::text, 'delete', to_jsonb(OLD), NULL, auth.uid(), now());
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

COMMENT ON FUNCTION public.log_inventory_items_audit() IS
  'Writes every insert/update/delete on inventory_items to audit_logs (table_name=inventory_items) so edits and deletes — including hard deletes — show up in admin activity history.';

DROP TRIGGER IF EXISTS trg_log_inventory_items_audit ON public.inventory_items;
CREATE TRIGGER trg_log_inventory_items_audit
AFTER INSERT OR UPDATE OR DELETE ON public.inventory_items
FOR EACH ROW EXECUTE FUNCTION public.log_inventory_items_audit();

CREATE OR REPLACE FUNCTION public.log_rooms_audit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, performed_by, performed_at)
    VALUES ('rooms', NEW.id::text, 'insert', NULL, to_jsonb(NEW), auth.uid(), now());
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, performed_by, performed_at)
    VALUES ('rooms', NEW.id::text, 'update', to_jsonb(OLD), to_jsonb(NEW), auth.uid(), now());
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, performed_by, performed_at)
    VALUES ('rooms', OLD.id::text, 'delete', to_jsonb(OLD), NULL, auth.uid(), now());
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

COMMENT ON FUNCTION public.log_rooms_audit() IS
  'Writes every insert/update/delete on rooms to audit_logs (table_name=rooms) so room edits and deletes show up in admin activity history.';

DROP TRIGGER IF EXISTS trg_log_rooms_audit ON public.rooms;
CREATE TRIGGER trg_log_rooms_audit
AFTER INSERT OR UPDATE OR DELETE ON public.rooms
FOR EACH ROW EXECUTE FUNCTION public.log_rooms_audit();

COMMIT;
