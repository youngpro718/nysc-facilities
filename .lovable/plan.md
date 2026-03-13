

# Notification & Alert System — Complete Audit

## Summary of Findings

The notification infrastructure is **solid at the database level** — triggers exist for all major events and correctly write to `admin_notifications` and `user_notifications`. The realtime listeners are well-structured. However, there are several specific issues:

---

## Issues Found

### 1. Duplicate Admin Notifications on Supply Request INSERT
**Severity: Medium**
`supply_requests` has **two** INSERT triggers that both write to `admin_notifications`:
- `handle_new_supply_request` → inserts admin notification + user notifications for Supply/Admin dept staff
- `notify_admin_on_supply_request_insert` → inserts another admin notification

Every new supply request generates **2 duplicate admin notifications**. Same duplication exists for issues (`handle_issue_notifications` + `notify_admin_on_issue_insert`) and key requests (`trg_emit_key_request_updates` + `notify_admins_of_key_request` + `notify_admin_on_key_request_insert`).

**Fix:** Drop the redundant `notify_admin_on_*_insert` triggers since the `handle_*` functions are more complete (they also create user notifications).

### 2. Duplicate User Notifications on Supply Request Status Change
**Severity: Medium**
Two triggers both fire on supply request UPDATE:
- `handle_supply_request_status_change` → writes user notification
- `handle_supply_request_notifications_realtime` → writes the same user notification

Users get **2 identical notifications** for every status change.

**Fix:** Drop `trigger_supply_request_notifications_realtime` since `handle_supply_request_status_change_trigger` is the more complete one.

### 3. Court Aide AlertsBar Low Stock Query is Broken
**Severity: High**
`AlertsBar.tsx` line 31: `.lt('quantity', supabase.rpc ? 'minimum_quantity' : 10)` — this tries to compare a column to another column via the PostgREST API, which **doesn't work**. PostgREST `.lt()` compares against a literal value, not another column. The string `'minimum_quantity'` is passed as a literal, so this query always returns 0 or wrong results.

**Fix:** Fetch all items with `minimum_quantity > 0` and filter client-side (same pattern the Overview panel uses), or use an RPC function.

### 4. InventoryManagement.tsx Uses Wrong Column Names
**Severity: Medium**
`InventoryManagement.tsx` maps DB fields to `current_stock` and `minimum_threshold`, but the actual DB columns are `quantity` and `minimum_quantity`. When the DB query succeeds, it returns objects with `quantity`/`minimum_quantity` — but the component's `InventoryItem` interface expects `current_stock`/`minimum_threshold`. This means `current_stock` is always `undefined`, so the stock alerts logic treats every item as 0-stock, generating false "OUT OF STOCK" alerts. When the query fails, it falls back to **hardcoded mock data**.

**Fix:** Map the correct column names in the interface or alias them in the query transform.

### 5. Realtime Listener Duplicates DB Trigger Toasts
**Severity: Low**
The `useAdminRealtimeNotifications` hook subscribes to INSERT events on `issues`, `supply_requests`, `key_requests`, and `key_orders` **directly** — and shows toast notifications. But the DB triggers already insert into `admin_notifications`, which the same hook also listens to. So admins see **two toasts**: one from the direct table listener and one from the `admin_notifications` INSERT.

**Fix:** Remove the direct table listeners from `useAdminRealtimeNotifications.ts` — the `admin_notifications` listener alone is sufficient since the DB triggers populate it.

### 6. No Notification for Low Stock Events
**Severity: Low**
There is no trigger on `inventory_items` to create a notification when stock drops below `minimum_quantity`. The "low stock" indicators are purely visual (queried on page load). Admins are never proactively notified.

**Fix (optional):** Add a trigger on `inventory_items` UPDATE that fires when `quantity` crosses below `minimum_quantity`.

### 7. Negative Quantity Item Excluded from Low Stock
**Severity: Low**
The Overview panel and Dashboard both filter `quantity > 0` for low stock, which excludes items with negative quantities (e.g., "2-Hole PaperPuncher" at -1). These should also appear.

**Fix:** Change the filter to `quantity >= 0` → `quantity < minimum_quantity` without the `> 0` guard, or treat `quantity <= 0` as out-of-stock.

---

## Fix Plan

### Database Changes (SQL migration)
1. **Drop duplicate INSERT triggers:**
   - `trg_notify_admin_on_issue_insert` (keep `trg_emit_issue_updates` which is more complete)
   - `trg_notify_admin_on_supply_request_insert` (keep `handle_new_supply_request_trigger`)
   - `trg_notify_admin_on_key_request_insert` (keep `trigger_notify_admins_key_request`)
2. **Drop duplicate status-change trigger:**
   - `trigger_supply_request_notifications_realtime` (keep `handle_supply_request_status_change_trigger`)
3. **Optional:** Add low-stock notification trigger on `inventory_items`

### Code Changes

| File | Change |
|------|--------|
| `src/hooks/realtime/useAdminRealtimeNotifications.ts` | Remove direct table listeners for `key_requests`, `supply_requests`, `issues`, `key_orders`, `profiles` — keep only the `admin_notifications` INSERT listener. The DB triggers already create the notifications; listening to both produces duplicate toasts. |
| `src/components/court-aide/AlertsBar.tsx` | Fix broken low stock query: fetch items with `minimum_quantity > 0`, then filter client-side where `quantity < minimum_quantity`. |
| `src/components/supply/InventoryManagement.tsx` | Fix column mapping: `current_stock` → `quantity`, `minimum_threshold` → `minimum_quantity`. Remove mock data fallback. |
| `src/components/inventory/InventoryOverviewPanel.tsx` | Include items with `quantity <= 0` in the out-of-stock count (change `quantity === 0` to `quantity <= 0`). |
| `src/pages/InventoryDashboard.tsx` | Same: change low stock filter from `quantity > 0` to also catch negative quantities. |
| `src/components/inventory/LowStockPanel.tsx` | Same fix for the out-of-stock query: use `lte('quantity', 0)` instead of `eq('quantity', 0)`. |

