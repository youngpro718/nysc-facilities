

# Dashboard Individualization Plan

## Current Problem
The **RoleDashboard** is a generic config-driven template — CMC, Court Officer, and Purchasing all get the same layout: 4 stat cards, 4 quick action cards, a recent activity list, and optional side panels. No unique identity, no interactive elements, no role-specific workflows.

The **CourtAideWorkCenter** is already purpose-built but its stat cards and header could be elevated to match the revamped design system.

The **UserDashboard** is the strongest — compact header, room card, pickup alerts, 2x2 actions, tabbed activity. Already interactive.

---

## Plan: Create 4 Distinct Dashboard Experiences

### 1. CMC Dashboard (Court Manager)
**Theme: Command Center — Oversight & Coordination**

Replace the generic RoleDashboard with a purpose-built CMC page:

- **Header**: Time-aware greeting with avatar (reuse `CompactHeader` pattern) + date + notification bell
- **Courtroom Health Strip**: Horizontal bar showing operational/maintenance/inactive counts as a segmented progress bar (green/amber/red), clickable to Court Operations
- **2-Column Layout**:
  - **Left: "My Workspace"** — My open issues (compact list, max 3, clickable), my supply requests (compact list with status pills), quick actions row (Report Issue, Order Supplies)
  - **Right: "Court Overview"** — Upcoming terms count with next term date, term sheet preview (reuse `TermSheetPreview` component), link to full court operations
- **Bottom**: Recent activity feed (compact, max 5 items)

No "Quick Actions" card grid. Actions are embedded contextually where they make sense.

**File**: New `src/pages/CMCDashboard.tsx` replacing RoleDashboard for CMC role

### 2. Court Officer Dashboard
**Theme: Security Hub — Keys, Access, Monitoring**

Purpose-built page focused on security operations:

- **Header**: Time-aware greeting + shift context (date)
- **Key Status Strip**: 3 inline stat pills — Total Keys / Checked Out / Available — with color coding (available < 5 = warning). Clickable to /keys
- **Primary Panel: "Active Key Assignments"** — Live list of currently checked-out keys with occupant name, room, and time elapsed. "Issue Key" and "Return Key" action buttons inline. Max 5 shown, "View All" link
- **Secondary Panel: "Lockbox Status"** — Count of active lockboxes with quick link
- **Term Sheet Preview**: Compact, who's in which courtroom today
- **Quick Actions Row**: Key Management, Building Layout, Term Sheet — as compact icon+label buttons (not cards)

**File**: New `src/pages/CourtOfficerDashboard.tsx`

### 3. Court Aide Work Center (Polish)
**Theme: Shift Dashboard — Execute & Fulfill**

Already good. Polish to match the new design language:

- **Upgrade stats** to use `StatusCard` pattern with left-border indicators instead of plain cards
- **Add time-aware greeting** with avatar (match other dashboards)
- Keep existing TaskWorkQueue, SupplyFulfillmentPanel, TodaySchedule, AlertsBar — they're already interactive and purpose-built

**File**: Edit `src/pages/CourtAideWorkCenter.tsx` and `src/components/court-aide/WorkCenterStats.tsx`

### 4. Standard User Dashboard (Polish)
**Theme: Personal Portal — Request & Track**

Already the strongest. Minor enhancements:

- Add a subtle "status summary" strip below the header: "2 supplies in progress · 1 issue open · 1 key held" as a single line with colored dots (replaces needing to check each tab)
- Keep everything else — it's already interactive and well-designed

**File**: Edit `src/pages/UserDashboard.tsx`

### 5. Routing Updates
- Map CMC to new `CMCDashboard`
- Map Court Officer to new `CourtOfficerDashboard`
- Keep Court Aide on `CourtAideWorkCenter`
- Keep Standard User on `UserDashboard`

**File**: Edit `src/App.tsx`

---

## Technical Details

- **CMCDashboard** and **CourtOfficerDashboard** will be standalone pages with their own data queries (extracted from the current RoleDashboard queries), not config-driven
- Reuse existing components: `CompactHeader`, `TermSheetPreview`, `StatusCard`, `Badge`, `Progress`
- Court Officer dashboard will query `key_assignments` with occupant joins for the live key list
- CMC dashboard will query `issues` (user's own), `supply_requests` (user's own), `court_rooms`, and `court_terms`
- `RoleDashboard.tsx` will remain as fallback for `purchasing_staff` only

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/pages/CMCDashboard.tsx` | Create — purpose-built CMC experience |
| `src/pages/CourtOfficerDashboard.tsx` | Create — purpose-built Court Officer experience |
| `src/pages/CourtAideWorkCenter.tsx` | Edit — add avatar header, polish stats |
| `src/components/court-aide/WorkCenterStats.tsx` | Edit — StatusCard pattern |
| `src/pages/UserDashboard.tsx` | Edit — add status summary strip |
| `src/App.tsx` | Edit — route CMC and Court Officer to new pages |

