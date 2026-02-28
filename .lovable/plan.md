

## Bug: Sidebar Navigation Mismatch — Tasks/Lighting/Court Operations

### Root Cause
When Tasks was added to the admin navigation tabs in `getRoleBasedNavigation()`, the corresponding `/tasks` route was **not added** to `getNavigationRoutes()`. Since `AppSidebar.tsx` matches navigation items to routes by array index (`routes[index]`), every item after Inventory is off by one:

| Sidebar Label | Expected Route | Actual Route |
|---|---|---|
| Tasks | /tasks | /lighting |
| Lighting | /lighting | /court-operations |
| Court Operations | /court-operations | /admin |
| Admin Center | /admin | (undefined) |

### Fix (1 line change)

**File: `src/components/layout/config/navigation.tsx`** — In `getNavigationRoutes`, admin block: add `'/tasks'` between `'/inventory'` and `'/lighting'`.

```
'/inventory',
'/tasks',        // ← add this line
'/lighting',
```

This realigns the routes array with the navigation tabs array so every index matches correctly.

