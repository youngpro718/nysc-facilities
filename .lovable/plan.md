

# Personalized, Minimal Experience Per Role

## The Problem

The app already routes each role to a different dashboard and sidebar, but users still feel overwhelmed because:

1. **Navigation has too many items** - even standard users see 4-5 sidebar tabs plus sub-pages. On mobile, this creates cognitive overload.
2. **Dashboards show cards/grids that feel "boxy"** - stats cards, quick actions cards, activity cards, term sheet — it's a lot of rectangles on screen.
3. **Admin sees everything, which is correct** - but non-admin roles (standard, CMC, court officer, court aide) should see a radically simpler, task-focused UI.

## Approach

Instead of trimming cards from the existing layout, redesign non-admin dashboards as **single-purpose action screens** — think of a phone's home screen with just the 2-3 things that person does daily. Admin keeps the full management view.

### Changes by Role

**Standard User** (the biggest simplification):
- Replace the current card-heavy dashboard with a **clean action list** layout:
  - Greeting + avatar at top
  - Pickup alert banner (when relevant)
  - **3 large action buttons** stacked vertically: "Order Supplies", "Report Issue", "Request Help" — each opens its respective form directly
  - Below: a single "My Activity" list showing all their open items (supplies, issues, keys) in one chronological feed — no tabs
  - Remove: stats strip, MyRoomCard, TermSheetPreview (standard users rarely need term sheet), separate quick-action grid
  - Navigation: just 2 items — "Home" and "My Activity"

**CMC (Court Manager)**:
- Keep current structure but reduce stats from 4 cards to **2 key numbers inline** (Active Courtrooms, Open Issues) shown as a compact header strip, not cards
- Merge quick actions into the header as icon buttons instead of a separate card grid
- Keep Term Sheet and Recent Activity as the main content

**Court Officer**:
- Same compact header treatment: key count + courtroom count inline
- Main content: Key assignment list (their primary job) front and center
- Term Sheet below

**Court Aide**:
- Compact header: Available Tasks count + Supply Requests count
- Main content: Task list they can claim, with a "Supply Room" button
- Remove the 4-card stats grid and 4-card quick actions grid

### Navigation Reduction

Reduce sidebar items for non-admin roles:

| Role | Current Nav Items | Proposed |
|------|------------------|----------|
| Standard | Dashboard, My Activity, Notifications, Profile | **Home, Activity** (notifications become a bell icon in header, profile via avatar tap) |
| CMC | 6 items | **Home, Court Ops, Activity** |
| Court Officer | 6 items | **Home, Keys, Activity** |
| Court Aide | 6 items | **Home, Tasks, Supply Room** |
| Admin | 11 items | **Keep all** (management needs full access) |

### Files to Modify

| File | Change |
|------|--------|
| `src/pages/UserDashboard.tsx` | Rewrite to minimal action-list layout |
| `src/pages/RoleDashboard.tsx` | Replace card grids with compact inline stats + focused content |
| `src/config/roleDashboardConfig.ts` | Simplify configs, remove excess stats/actions |
| `src/components/layout/config/navigation.tsx` | Reduce nav items per role |
| `src/components/user/CompactHeader.tsx` | May need minor adjustments |

### What Stays the Same
- Admin Dashboard — full management view, untouched
- All underlying pages (inventory, keys, spaces, etc.) — unchanged
- Routing and permissions — unchanged
- Data hooks and queries — reused, just displayed differently

