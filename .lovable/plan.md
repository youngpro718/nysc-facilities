## Plan

### 1. Make inventory stock status consistent everywhere
Standardize all inventory tabs to use the existing centralized stock rules in `src/features/inventory/utils/stockStatus.ts`:
- `isLowStock`: tracked item with quantity below minimum, but above zero
- `isOutOfStock`: tracked item at zero or below
- `needsAttention`: low stock or out of stock

This will fix cases where Overview shows an alert but Stock/Alerts/Storage do not match.

### 2. Align inventory dashboard counts and badges
Update these areas so they report the same numbers:
- `InventoryDashboard.tsx`: keep tab badge count based on `needsAttention`
- `InventoryOverviewPanel.tsx`: use full attention counts, not a truncated low-stock preview count
- `InventoryItemsPanel.tsx`: use centralized `getStockStatus` instead of local logic that currently marks `quantity === minimum_quantity` as low
- `LowStockPanel.tsx`: keep low-stock and out-of-stock separated visually, but ensure the total matches Overview and tab badges
- `StorageRoomsPanel.tsx`: ensure storage room low/out counts follow the same rule set
- `RoleDashboard.tsx`: replace the hardcoded `quantity < 10` low-stock query with the minimum-quantity based logic

### 3. Fix inventory refresh/invalidation gaps
Update inventory mutations so creating, editing, deleting, adjusting stock, and uploading photos refresh every affected inventory query:
- overview stats
- low-stock alerts
- out-of-stock alerts
- stock list
- storage rooms
- optimized inventory hooks

This prevents one tab from showing fresh stock data while another tab still shows stale cached data.

### 4. Prevent the admin dashboard from briefly looking like a regular user
Fix role loading so the app does not fall back to `standard` while role/profile data is still unresolved:
- remove/soften the 3-second `useRolePermissions` timeout that sets standard permissions
- keep navigation/sidebar in a loading skeleton state until role resolution succeeds or shows an explicit retry state
- avoid routing admin users to `/dashboard` because role/profile is temporarily missing

This targets the symptom where the app initially looks like a regular user, then goes to the correct admin dashboard after interaction.

### 5. Verify the fix
After implementation, check:
- low-stock/out-of-stock numbers match across Overview, Alerts, Stock, Storage, and role dashboard
- changing stock updates all tabs without reload
- root `/` no longer flashes or falls back to the regular user dashboard for admin/system admin/facilities manager roles

## Expected result
Inventory pages will share one source of truth for stock status, and admin users should see the correct admin dashboard/navigation after loading instead of a temporary regular-user view.