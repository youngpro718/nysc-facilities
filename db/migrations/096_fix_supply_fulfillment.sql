-- =============================================================================
-- Migration 096: Fix silent supply-request fulfillment failures
--
-- Bug (verified live, 2026-07-08/09):
--   All three court-aide fulfillment UI paths (PartialFulfillmentDialog,
--   ImprovedSupplyStaffDashboard "Quick Ready", SupplyFulfillmentPanel) do:
--     1. supabase.rpc('adjust_inventory_quantity', ...)          -- succeeds
--     2. supabase.from('supply_request_items').update(...)       -- succeeds
--     3. supabase.from('supply_requests').update({status:'ready', ...})
--   Step 3 silently affects 0 rows for court_aide because RLS policy
--   supply_requests_fulfillment (UPDATE) only allows court_aide when the
--   CURRENT status is IN ('approved','in_progress','completed','picked_up',
--   'delivered','fulfilled') and the NEW status is in a similar list. The
--   queue shows orders in 'submitted'/'received'/'picking', and the UI
--   writes 'ready' -- both outside the policy. None of the client calls
--   check the returned {error}, and PostgREST returns success on a 0-row
--   UPDATE. Result: the order never leaves the "New" queue, the aide
--   retries, and inventory is deducted repeatedly (2x-6x observed in prod;
--   see 097_repair_fulfillment_data.sql.applied.txt for the repair).
--
-- Fix:
--   a) New atomic fulfill_supply_request() RPC: does the inventory
--      deduction, item fulfillment, and status transition in a single
--      SECURITY DEFINER transaction, gated on the request's current status
--      so an already-'ready'/'completed' order can never be re-fulfilled
--      (this is what caused the repeated deductions).
--   b) Broaden supply_requests_fulfillment so direct status-update paths
--      (SupplyFulfillmentPanel's Start / Mark Ready buttons) also work
--      under RLS, now that the client checks {error} on them.
--   c) Harden adjust_inventory_quantity with a role gate -- it was callable
--      by any authenticated user regardless of role.
--
-- Note: a DIFFERENT fulfill_supply_request(uuid, text, jsonb) already
-- exists from migration 031 (sets status='completed', used by
-- unifiedSupplyService.fulfillSupplyRequest for an unrelated pickup-
-- confirmation flow). This migration adds a second overload,
-- fulfill_supply_request(uuid, jsonb, text), distinguished by argument
-- types/names. p_delivery_method intentionally has NO default -- PostgREST
-- resolves overloaded RPCs by the set of parameter names in the request
-- body, and if p_delivery_method also defaulted, a call passing only
-- {p_request_id, p_items} would be ambiguous between the two overloads.
-- Requiring p_delivery_method keeps them unambiguous.
-- =============================================================================

-- (a) Atomic fulfillment RPC ---------------------------------------------------

DROP FUNCTION IF EXISTS public.fulfill_supply_request(uuid, jsonb, text);

CREATE FUNCTION public.fulfill_supply_request(
  p_request_id uuid,
  p_items jsonb,
  p_delivery_method text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_request supply_requests%ROWTYPE;
  v_item jsonb;
  v_item_id uuid;
  v_qty_fulfilled integer;
  v_notes text;
  v_ri supply_request_items%ROWTYPE;
  v_prev_qty integer;
  v_new_qty integer;
  v_has_partial boolean := false;
  v_has_out_of_stock boolean := false;
BEGIN
  IF NOT has_any_role(ARRAY['admin', 'system_admin', 'facilities_manager', 'cmc', 'purchasing', 'court_aide']) THEN
    RAISE EXCEPTION 'insufficient_privilege' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_request
  FROM supply_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'supply_request_not_found: %', p_request_id;
  END IF;

  IF v_request.status NOT IN ('submitted', 'approved', 'received', 'picking') THEN
    RAISE EXCEPTION 'supply_request_not_fulfillable: request % has status %', p_request_id, v_request.status;
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_item_id := (v_item->>'item_id')::uuid;
    v_qty_fulfilled := GREATEST(0, COALESCE((v_item->>'quantity_fulfilled')::integer, 0));
    v_notes := v_item->>'notes';

    SELECT * INTO v_ri
    FROM supply_request_items
    WHERE id = v_item_id AND request_id = p_request_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'supply_request_item_not_found: % on request %', v_item_id, p_request_id;
    END IF;

    IF v_qty_fulfilled < v_ri.quantity_requested THEN
      v_has_partial := true;
    END IF;
    IF v_qty_fulfilled = 0 THEN
      v_has_out_of_stock := true;
    END IF;

    UPDATE supply_request_items
    SET quantity_fulfilled = v_qty_fulfilled,
        quantity_approved = v_qty_fulfilled,
        notes = COALESCE(v_notes, notes),
        updated_at = now()
    WHERE id = v_ri.id;

    IF v_qty_fulfilled > 0 THEN
      SELECT quantity INTO v_prev_qty
      FROM inventory_items
      WHERE id = v_ri.item_id
      FOR UPDATE;

      v_new_qty := GREATEST(0, COALESCE(v_prev_qty, 0) - v_qty_fulfilled);

      UPDATE inventory_items
      SET quantity = v_new_qty, updated_at = now()
      WHERE id = v_ri.item_id;

      INSERT INTO inventory_item_transactions (
        item_id, transaction_type, quantity, previous_quantity, new_quantity, performed_by, notes
      ) VALUES (
        v_ri.item_id,
        'fulfilled',
        v_qty_fulfilled,
        COALESCE(v_prev_qty, 0),
        v_new_qty,
        auth.uid(),
        COALESCE(v_notes, format('Order #%s - %s/%s fulfilled', p_request_id, v_qty_fulfilled, v_ri.quantity_requested))
      );
    END IF;
  END LOOP;

  UPDATE supply_requests
  SET status = 'ready',
      picking_completed_at = now(),
      ready_for_delivery_at = now(),
      fulfilled_by = auth.uid(),
      fulfilled_at = now(),
      delivery_method = COALESCE(p_delivery_method, delivery_method),
      metadata = COALESCE(v_request.metadata, '{}'::jsonb) || jsonb_build_object(
        'delivery_method', p_delivery_method,
        'partial_fulfillment', (v_has_partial OR v_has_out_of_stock),
        'fulfilled_by', auth.uid()
      )
  WHERE id = p_request_id
  RETURNING * INTO v_request;

  RETURN row_to_json(v_request);
END;
$function$;

COMMENT ON FUNCTION public.fulfill_supply_request(uuid, jsonb, text) IS
  'Atomically fulfills a supply request: deducts inventory, records transactions, updates line items, and transitions the request to ready -- all in one SECURITY DEFINER transaction so partial client failures cannot leave inventory deducted without the status advancing (which caused repeated double-deduction under the old multi-call client flow). p_delivery_method has no default so this overload never collides with fulfill_supply_request(uuid, text, jsonb) from migration 031 under PostgREST name-based overload resolution.';

GRANT EXECUTE ON FUNCTION public.fulfill_supply_request(uuid, jsonb, text) TO authenticated;
REVOKE ALL ON FUNCTION public.fulfill_supply_request(uuid, jsonb, text) FROM anon;
REVOKE ALL ON FUNCTION public.fulfill_supply_request(uuid, jsonb, text) FROM PUBLIC;

-- (b) Broaden supply_requests_fulfillment so direct status updates work too --

DROP POLICY IF EXISTS supply_requests_fulfillment ON public.supply_requests;
CREATE POLICY supply_requests_fulfillment ON public.supply_requests
  FOR UPDATE TO authenticated
  USING (
    has_any_role(ARRAY['admin', 'system_admin', 'facilities_manager', 'cmc', 'purchasing'])
    OR (
      has_any_role(ARRAY['court_aide'])
      AND status IN ('submitted', 'received', 'picking', 'ready', 'approved', 'in_progress', 'completed', 'picked_up', 'delivered', 'fulfilled')
    )
    OR (requester_id = auth.uid() AND status = 'pending_approval')
  )
  WITH CHECK (
    has_any_role(ARRAY['admin', 'system_admin', 'facilities_manager', 'cmc', 'purchasing'])
    OR (
      has_any_role(ARRAY['court_aide'])
      AND status IN ('received', 'picking', 'ready', 'in_progress', 'completed', 'picked_up', 'delivered', 'fulfilled')
    )
    OR (requester_id = auth.uid() AND status IN ('pending_approval', 'cancelled'))
  );

COMMENT ON POLICY supply_requests_fulfillment ON public.supply_requests IS
  'Allows fulfillment-stage updates for privileged users and court aides across the full submitted->received->picking->ready pipeline; court_aide still cannot touch pending_approval.';

-- (c) Harden adjust_inventory_quantity with a role gate ----------------------

CREATE OR REPLACE FUNCTION public.adjust_inventory_quantity(
  p_item_id uuid,
  p_quantity_change integer,
  p_transaction_type text,
  p_reference_id uuid DEFAULT NULL::uuid,
  p_notes text DEFAULT NULL::text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_prev_qty INTEGER;
  v_new_qty INTEGER;
BEGIN
  IF NOT has_any_role(ARRAY['admin', 'system_admin', 'facilities_manager', 'cmc', 'purchasing', 'court_aide']) THEN
    RAISE EXCEPTION 'insufficient_privilege' USING ERRCODE = '42501';
  END IF;

  -- Get current quantity
  SELECT quantity INTO v_prev_qty
  FROM inventory_items
  WHERE id = p_item_id;

  v_new_qty := COALESCE(v_prev_qty, 0) + p_quantity_change;

  -- Update inventory
  UPDATE inventory_items
  SET quantity = v_new_qty, updated_at = NOW()
  WHERE id = p_item_id;

  -- Record transaction with correct column names
  INSERT INTO inventory_item_transactions (
    item_id,
    transaction_type,
    quantity,
    previous_quantity,
    new_quantity,
    performed_by,
    notes
  ) VALUES (
    p_item_id,
    p_transaction_type,
    ABS(p_quantity_change),
    COALESCE(v_prev_qty, 0),
    v_new_qty,
    auth.uid(),
    COALESCE(p_notes, 'Inventory adjustment')
  );
END;
$function$;
