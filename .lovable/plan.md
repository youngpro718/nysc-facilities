## Inventory Low-Stock Alerting Audit

### What I found

I traced every place inventory stock is checked, alerted, displayed, and invalidated. The pipeline works in pieces but has real gaps that explain why removing items doesn't always alert.

**1. DB trigger fires only once per crossing** (`public.notify_low_stock` on `inventory_items`)
The trigger only inserts an `admin_notifications` row when `OLD.quantity >= OLD.minimum_quantity AND NEW.quantity < NEW.minimum_quantity`. Consequences:
- If an item is already low and you remove more (e.g., 4 → 2 → 0), no new alert ever fires.
- Hitting zero ("out of stock") never escalates — urgency would have been `high`, but the trigger never re-runs.
- Raising `minimum_quantity` above current `quantity` (now logically low) doesn't fire — the OLD comparison uses OLD.minimum_quantity.
- An UPDATE that doesn't touch `quantity` or `minimum_quantity` still re-evaluates and can spam if both sides flip-flop.

**2. Inconsistent "low stock" definition across the UI** (8+ call sites)
| Location | Rule |
|---|---|
| `services/optimized/inventoryService.ts` | `quantity <= minimum_quantity` (no `> 0` guard) |
| `dashboard/commandCenterService.ts` | `quantity < (minimum_quantity || 0)` |
| `inventory/pages/InventoryDashboard.tsx` | `minimum_quantity > 0 && quantity < minimum_quantity` |
| `StorageRoomsPanel.tsx` / `InventoryOverviewPanel.tsx` | `minimum_quantity > 0 && quantity > 0 && quantity < minimum_quantity` (excludes zero!) |
| `useOptimizedInventory.ts` (critical) | `quantity > 0 && quantity <= minimum_quantity * 0.5` |

Result: the same item shows as low-stock in one panel and not another, and out-of-stock items get hidden in two panels.

**3. Realtime toast is admin-only**
`useAdminRealtimeNotifications` is guarded by `isAdmin`. Supply staff, purchasing, and facilities managers never see low-stock toasts even though they act on them.

**4. Command center surfaces low-stock only when > 5 items**
`commandCenterService.ts` line 373 gates the alert behind `low_stock_items > 5`. Small inventories never trigger the dashboard banner.

**5. Cache invalidation map is incomplete**
The realtime hook invalidates `low-stock-items`, `low-stock-overview`, etc., but writes from `useInventory`, `InventoryAdjustmentDialog`, and supply fulfillment don't all invalidate the same keys, so panels can stay stale until refresh.

### Plan

**A. Fix the DB trigger** (migration)
- Re-fire on every UPDATE that lowers `quantity` while still below `minimum_quantity`, with debouncing: only insert if the most recent `low_stock` notification for that `related_id` is older than 30 minutes OR severity changes (low → out_of_stock).
- Add an explicit `out_of_stock` notification type when `quantity` hits 0 from any positive value, with `urgency = 'high'`.
- Fire when `minimum_quantity` is raised above current `quantity`.
- Guard with `minimum_quantity > 0` so items without a min never alert.

**B. Centralize the low-stock rule** (frontend)
- Add `src/features/inventory/utils/stockStatus.ts` exporting:
  - `isLowStock(item)` → `minimum_quantity > 0 && quantity > 0 && quantity < minimum_quantity`
  - `isOutOfStock(item)` → `minimum_quantity > 0 && quantity <= 0`
  - `isCritical(item)` → `isLowStock && quantity <= minimum_quantity * 0.5`
  - `getStockStatus(item)` → `'ok' | 'low' | 'critical' | 'out'`
- Replace all 8 inline implementations with these helpers. Counts will finally agree across dashboard, overview, storage rooms, and command center.

**C. Broaden realtime delivery**
- Create `useInventoryRealtimeNotifications` (or extend the admin hook) that subscribes to `admin_notifications` filtered to `notification_type IN ('low_stock','out_of_stock')` for roles: `admin`, `purchasing`, `facilities_manager`, `supply` staff. Toast + query invalidation.

**D. Remove the > 5 gate on the command center**
- Show the alert whenever `low_stock_items + out_of_stock_items > 0`, with severity scaling on count.

**E. Tighten cache invalidation**
- Audit `invalidationMap.ts` and every inventory write path (`useInventory`, `InventoryAdjustmentDialog`, `unifiedSupplyService.markOrderReady`, `useOptimizedInventory` mutations) to invalidate the same standard set: `['inventory-items']`, `['low-stock-items']`, `['low-stock-overview']`, `['inventory-overview-items']`, `['inventory-stats']`, `['court-aide-alerts']`.

**F. QA pass**
- Manually walk the scenarios: drop above-min → low, low → lower, low → 0, raise min above qty, restock back above min. Confirm each produces the expected notification, toast, and panel update for admin, purchasing, and supply staff.

### Out of scope (flagging only)
- Email/SMS escalation for `out_of_stock` — separate ask.
- Per-room low-stock alerts (current trigger is global per item).

### Technical notes
- Migration touches only `public.notify_low_stock` (replace) and adds an optional `notification_type='out_of_stock'`; no schema column changes.
- All frontend changes are presentation/logic only; no Supabase types regeneration needed.
- Roles use existing `has_role()` helpers — no new tables.