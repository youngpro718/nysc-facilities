

# UI/UX Design Overhaul — Implementation Plan

This PRD contains ~30 distinct changes across 3 priority tiers. Given the scope, this must be broken into multiple implementation rounds. Each round should be a single prompt to avoid overwhelming the codebase.

---

## Phased Implementation Strategy

### Phase 1: Foundation (P0 — Design System + Sidebar)
**Must be done first — all other changes depend on this.**

#### Round 1A: Design Tokens & Standard Card Component
- Add new CSS custom properties to `src/index.css` (color tokens from PRD 3.1)
- Add typography scale tokens (PRD 3.2) 
- Add spacing scale tokens (PRD 3.4)
- Create a reusable `StatusCard` component (`src/components/ui/StatusCard.tsx`) with props: `statusVariant`, `title`, `value`, `subLabel`, `icon` — uses left-border pattern instead of colored fills
- Add micro-interaction CSS (hover translateY, transitions) as utility classes

#### Round 1B: Left Sidebar Navigation
- Create `src/components/layout/components/AppSidebar.tsx` — a new collapsible left sidebar using the existing `SidebarProvider` infrastructure
- Items: Dashboard, Spaces, Issues, Access & Assignments, Keys, Inventory, Tasks, Lighting, Court Operations, divider, Admin Center
- Active state with red accent left border
- Collapsed state (64px) with icon-only + tooltips
- User info + sign out pinned to bottom
- Move Help link into sidebar footer (remove floating `HelpButton`)

#### Round 1C: Layout Shell Refactor
- Refactor `src/components/layout/Layout.tsx`:
  - Wrap content in `SidebarProvider` + `AppSidebar`
  - Convert top header from full nav to: page title (left) + search/notifications/theme/avatar (right)
  - Remove `DesktopNavigationImproved` from header
  - Keep `BottomTabBar` for mobile (sidebar hidden on mobile)
  - Remove `<HelpButton />` from Layout
- Adjust main content area with left margin matching sidebar width

---

### Phase 2: Dashboard Improvements (P1)

#### Round 2A: Dashboard Header + KPI Strip
- Update `DashboardHeader.tsx` with personalized greeting (Good morning/afternoon/evening, [First Name]) + date
- Create `GlobalKPIStrip.tsx` — 4 `StatusCard` instances: Total Active Issues, System Health %, Tasks Pending, Maintenance Queue
- Wire to existing Supabase queries

#### Round 2B: Building Card Restructure
- Simplify `BuildingCard.tsx` layout: photo → name/address → 3-column stat row → issues banner (conditional)
- Remove nested colored mini-cards
- Replace watermarked photos with gradient placeholders using building status color

---

### Phase 3: Page-Level P1 Changes

#### Round 3A: Operations Page
- Replace colored-fill KPI cards with `StatusCard` (left-border variants)
- Improve issue table rows: colored priority dots, status pills with tinted backgrounds, minimum 52px row height

#### Round 3B: Spaces Page
- Add status dots (green/amber/red) to room list rows
- Add floor badge pills
- Restructure room detail panel layout

#### Round 3C: Lighting + Tasks Pages
- Lighting: reorder KPI cards (Critical first), replace colored fills with `StatusCard`
- Tasks: make Active Tasks card visually dominant, enhance task cards with priority dot, description, due date, assignee initials

#### Round 3D: Inventory + Access + Court Ops
- Inventory: add sparkline to Recent Activity card (Recharts already installed), reposition search
- Access & Assignments: add role color badges, avatar initials circles
- Court Operations: improve alert banner with CTA button, add inline previews to stat cards

---

### Phase 4: Polish (P2)

#### Round 4A: Global Polish
- Empty/zero states with contextual icons + messages
- Notification bell unread badge count
- Page transition animation (180ms fade/slide-up)
- Sidebar divider above Admin Center (already planned in sidebar)

#### Round 4B: Table Density Toggle
- Add compact/comfortable toggle to Issues and Spaces tables
- Store preference in localStorage

---

## Technical Notes

- The existing `SidebarProvider` component in `src/components/ui/sidebar/` provides collapse/expand, mobile sheet, keyboard shortcut — we reuse this
- Navigation config in `src/components/layout/config/navigation.tsx` already has the correct item list and route mapping — sidebar will consume `getRoleBasedNavigation()`
- `getNavigationPath()` in `utils/navigationPaths.ts` handles role-dependent routing — sidebar uses this
- Recharts is already installed for sparklines
- Dark mode tokens in `index.css` use HSL format — new tokens should follow the same pattern or use raw hex with CSS custom properties
- The `BottomTabBar` remains for mobile; sidebar is `hidden md:flex`
- No backend/API changes required — all changes are purely visual

---

## Recommended Starting Point

**Start with Round 1A (tokens + StatusCard)**, then **Round 1B (sidebar component)**, then **Round 1C (layout refactor)**. These are the critical path — everything else builds on them.

Estimated total: ~8-12 implementation rounds across all phases.

