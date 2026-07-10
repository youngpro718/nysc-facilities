-- =============================================================================
-- Migration 103: One catalog listing per product, stocked in many rooms
--
-- Problem (verified live, 2026-07-10):
--   inventory_items is one row per product PER STORAGE ROOM (storage_room_id),
--   and the user-facing inventory_catalog view (migration 080) is a straight
--   SELECT over it with no status filter. So the same product stocked in
--   several rooms/buildings shows up in the ordering catalog once per room
--   (e.g. "8X11 Copy Paper" in 10 Mez @ 111 Centre AND 15 fl. Copy room
--   @ 100 Centre, plus "Copy Paper (White) 8 X 11" in 10S), and inactive
--   duplicate rows show up too.
--
-- Fix:
--   a) inventory_items.catalog_item_id — a self-link that marks a row as
--      "counts under" another row's catalog listing. The linked-to row is the
--      PRIMARY listing (the one people see and order); linked rows are room
--      stock only. Single-level: a child cannot be a primary, a primary
--      cannot become a child while it has children (guard trigger).
--   b) inventory_catalog view now shows only ACTIVE, PRIMARY rows, and
--      derives stock_status from the whole group's quantity (primary +
--      active children) so "in stock" reflects every room that holds it.
--      Raw quantities remain unexposed.
--   c) fulfill_supply_request(uuid, jsonb, text) accepts an optional
--      per-line source_item_id so staff can deduct from the room the stock
--      was actually pulled from. Must be in the same catalog group as the
--      ordered item; defaults to the ordered item (old behavior).
--   d) Data: link the known copy-paper duplicates under the
--      "Copy Paper (White) ..." listings (name-matched, idempotent).
--
-- Per-room stock keeps living on each inventory_items row; admin inventory
-- management is unchanged.
-- =============================================================================

BEGIN;

-- (a) Grouping column -----------------------------------------------------

ALTER TABLE public.inventory_items
  ADD COLUMN IF NOT EXISTS catalog_item_id uuid NULL
    REFERENCES public.inventory_items(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.inventory_items.catalog_item_id IS
  'When set, this row is room-level stock counted under another item''s catalog listing and is hidden from the user-facing catalog. NULL = this row IS a catalog listing. Single-level only (enforced by trg_inventory_catalog_link).';

CREATE INDEX IF NOT EXISTS idx_inventory_items_catalog_item_id
  ON public.inventory_items (catalog_item_id)
  WHERE catalog_item_id IS NOT NULL;

-- Guard: keep groups single-level so view aggregation and fulfillment
-- validation never have to walk a chain.
CREATE OR REPLACE FUNCTION public.enforce_inventory_catalog_link()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.catalog_item_id IS NOT NULL THEN
    IF NEW.catalog_item_id = NEW.id THEN
      RAISE EXCEPTION 'inventory_catalog_link_self: item cannot be linked to itself';
    END IF;
    IF EXISTS (
      SELECT 1 FROM inventory_items p
      WHERE p.id = NEW.catalog_item_id AND p.catalog_item_id IS NOT NULL
    ) THEN
      RAISE EXCEPTION 'inventory_catalog_link_chain: target item is itself linked under another listing';
    END IF;
    IF EXISTS (
      SELECT 1 FROM inventory_items c
      WHERE c.catalog_item_id = NEW.id
    ) THEN
      RAISE EXCEPTION 'inventory_catalog_link_has_children: item has room stock linked under it and cannot be linked under another listing';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_inventory_catalog_link ON public.inventory_items;
CREATE TRIGGER trg_inventory_catalog_link
  BEFORE INSERT OR UPDATE OF catalog_item_id ON public.inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_inventory_catalog_link();

-- (b) Deduplicated catalog view --------------------------------------------

-- Same column list as migration 080, so CREATE OR REPLACE is not needed and
-- existing grants/clients keep working; only the row set and the stock_status
-- derivation change.
DROP VIEW IF EXISTS public.inventory_catalog;
CREATE VIEW public.inventory_catalog AS
SELECT
  i.id,
  i.name,
  i.sku,
  i.unit,
  i.category_id,
  i.photo_url,
  i.requires_justification,
  i.order_code_threshold,
  i.pack_size,
  i.pack_label,
  i.case_size,
  i.case_label,
  i.packaging_note,
  -- Derived stock status over the whole group (this room + every active row
  -- linked under this listing). Threshold falls back to 10 if
  -- minimum_quantity is unset. Raw quantity is intentionally NOT exposed.
  CASE
    WHEN COALESCE(i.quantity, 0) + COALESCE(g.child_quantity, 0) <= 0 THEN 'out'
    WHEN COALESCE(i.quantity, 0) + COALESCE(g.child_quantity, 0)
         <= GREATEST(COALESCE(i.minimum_quantity, 0), 10) THEN 'low'
    ELSE 'in_stock'
  END AS stock_status
FROM public.inventory_items i
LEFT JOIN LATERAL (
  SELECT SUM(COALESCE(c.quantity, 0)) AS child_quantity
  FROM public.inventory_items c
  WHERE c.catalog_item_id = i.id
    AND COALESCE(c.status, 'active') = 'active'
) g ON true
WHERE COALESCE(i.status, 'active') = 'active'
  AND i.catalog_item_id IS NULL;

COMMENT ON VIEW public.inventory_catalog IS
  'User-facing supply catalog. One row per product: only active items that are not linked under another listing (catalog_item_id IS NULL). stock_status (in_stock/low/out) aggregates quantity across the listing and all active rows linked to it, without leaking raw counts. Admin inventory management still queries inventory_items directly.';

GRANT SELECT ON public.inventory_catalog TO authenticated;

-- (c) Fulfillment: optional per-line source room ----------------------------

-- Same signature as migration 096 (so PostgREST overload resolution against
-- fulfill_supply_request(uuid, text, jsonb) from migration 031 is unchanged);
-- each p_items element may now carry "source_item_id": the inventory_items
-- row (a specific room's stock) to deduct from. It must be the ordered item
-- itself or in the same catalog group; omitted = the ordered item, exactly
-- the pre-103 behavior.
CREATE OR REPLACE FUNCTION public.fulfill_supply_request(
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
  v_source_id uuid;
  v_source_canonical uuid;
  v_line_canonical uuid;
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
      -- Which room's stock to deduct. Defaults to the ordered row; a
      -- provided source must be in the same catalog group (same row, its
      -- primary, one of its children, or a sibling under the same primary).
      v_source_id := COALESCE(NULLIF(v_item->>'source_item_id', '')::uuid, v_ri.item_id);

      IF v_source_id IS DISTINCT FROM v_ri.item_id THEN
        SELECT COALESCE(catalog_item_id, id) INTO v_source_canonical
        FROM inventory_items WHERE id = v_source_id;
        IF NOT FOUND THEN
          RAISE EXCEPTION 'source_item_not_found: %', v_source_id;
        END IF;
        SELECT COALESCE(catalog_item_id, id) INTO v_line_canonical
        FROM inventory_items WHERE id = v_ri.item_id;
        IF v_source_canonical IS DISTINCT FROM v_line_canonical THEN
          RAISE EXCEPTION 'source_item_not_in_catalog_group: % is not stock for ordered item %', v_source_id, v_ri.item_id;
        END IF;
      END IF;

      SELECT quantity INTO v_prev_qty
      FROM inventory_items
      WHERE id = v_source_id
      FOR UPDATE;

      v_new_qty := GREATEST(0, COALESCE(v_prev_qty, 0) - v_qty_fulfilled);

      UPDATE inventory_items
      SET quantity = v_new_qty, updated_at = now()
      WHERE id = v_source_id;

      INSERT INTO inventory_item_transactions (
        item_id, transaction_type, quantity, previous_quantity, new_quantity, performed_by, notes
      ) VALUES (
        v_source_id,
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
  'Atomically fulfills a supply request: deducts inventory, records transactions, updates line items, and transitions the request to ready in one SECURITY DEFINER transaction. Each p_items element may carry source_item_id (an inventory row in the same catalog group, migration 103) to deduct from the room the stock was physically pulled from; defaults to the ordered row. p_delivery_method has no default so this overload never collides with fulfill_supply_request(uuid, text, jsonb) from migration 031 under PostgREST name-based overload resolution.';

-- (d) Link the known copy-paper duplicates ----------------------------------

-- "Copy Paper (White) 8 X 11" (10S) is the listing with the ream/case
-- ordering config; the plain "8X11 Copy Paper" rows in other rooms become
-- room stock under it. Same for 8 X 14. Name-matched and idempotent; no-ops
-- if the rows have been renamed or already linked.
WITH primary_8x11 AS (
  SELECT id FROM public.inventory_items
  WHERE lower(btrim(name)) = 'copy paper (white) 8 x 11'
    AND COALESCE(status, 'active') = 'active'
    AND catalog_item_id IS NULL
  ORDER BY created_at NULLS LAST
  LIMIT 1
)
UPDATE public.inventory_items i
SET catalog_item_id = (SELECT id FROM primary_8x11), updated_at = now()
WHERE lower(btrim(i.name)) = '8x11 copy paper'
  AND COALESCE(i.status, 'active') = 'active'
  AND i.catalog_item_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM public.inventory_items c WHERE c.catalog_item_id = i.id)
  AND i.id <> (SELECT id FROM primary_8x11)
  AND EXISTS (SELECT 1 FROM primary_8x11);

WITH primary_8x14 AS (
  SELECT id FROM public.inventory_items
  WHERE lower(btrim(name)) = 'copy paper (white) 8 x 14'
    AND COALESCE(status, 'active') = 'active'
    AND catalog_item_id IS NULL
  ORDER BY created_at NULLS LAST
  LIMIT 1
)
UPDATE public.inventory_items i
SET catalog_item_id = (SELECT id FROM primary_8x14), updated_at = now()
WHERE lower(btrim(i.name)) = '8x14 copy paper'
  AND COALESCE(i.status, 'active') = 'active'
  AND i.catalog_item_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM public.inventory_items c WHERE c.catalog_item_id = i.id)
  AND i.id <> (SELECT id FROM primary_8x14)
  AND EXISTS (SELECT 1 FROM primary_8x14);

COMMIT;
