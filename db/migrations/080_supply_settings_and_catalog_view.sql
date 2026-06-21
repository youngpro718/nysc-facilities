-- Migration 080: Non-leaking inventory catalog view
--
-- Why:
--   Hide raw stock counts from non-admin users. Stock numbers were rendered in
--   cards, rows, and toast notifications. Users should only see
--   "in stock / low / out", not the actual count. The user-facing supply
--   browse reads from this view; admin inventory management continues to
--   query inventory_items directly.
--
-- Approval / quantity gating lives on each inventory_item (the existing
-- requires_justification and order_code_threshold columns). There is no
-- global "approval threshold" table — those gates are per-item, editable in
-- the inventory item form.
--
-- Apply manually after review.

BEGIN;

CREATE OR REPLACE VIEW public.inventory_catalog AS
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
  -- Derived stock status. Threshold falls back to 10 if minimum_quantity is unset.
  CASE
    WHEN COALESCE(i.quantity, 0) <= 0 THEN 'out'
    WHEN COALESCE(i.quantity, 0) <= GREATEST(COALESCE(i.minimum_quantity, 0), 10) THEN 'low'
    ELSE 'in_stock'
  END AS stock_status
FROM public.inventory_items i;

COMMENT ON VIEW public.inventory_catalog IS
  'User-facing supply catalog. Exposes derived stock_status (in_stock/low/out) without leaking raw quantity. Non-admin reads should use this view; admin inventory management still queries inventory_items directly.';

GRANT SELECT ON public.inventory_catalog TO authenticated;

COMMIT;
