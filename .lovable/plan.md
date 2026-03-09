

# App-Wide Revamp Plan

Based on my audit, here's what needs improvement across the five areas you mentioned, plus the rename.

---

## 1. Rename: "Operations" to "Building Issues"

The page title, nav sidebar label, breadcrumb, and URL references all say "Operations." We will:
- Rename nav item title from "Operations" to "Building Issues" in `navigation.tsx`
- Update the page heading in `Operations.tsx` from "Operations" to "Building Issues"
- Update `navigationPaths.ts` references
- Keep the URL path `/operations` unchanged to avoid breaking links

---

## 2. Lighting Page Revamp

**Current state:** Functional but plain. The dashboard uses basic `Card` components for Room/Hallway breakdown instead of the standardized `StatusCard` pattern. Quick Actions section is generic.

**Changes:**
- Replace Room Lighting / Hallway Lighting plain cards with `StatusCard` components using health-rate-driven status variants (green/amber/red)
- Add a progress bar showing overall system health visually
- Add a "Needs Attention" summary row showing non-functional + maintenance fixtures with urgency styling
- Improve the Quick Actions card to match the Operations overview style (icon cards with hover states)

---

## 3. Keys Page Revamp

**Current state:** `KeyStatisticsCards` uses plain `Card` components without the `StatusCard` pattern. No status-driven coloring.

**Changes:**
- Replace all 4 stat cards with `StatusCard` using semantic variants (e.g., "Available" = operational, "Assigned" = info, low availability = warning)
- Add a "Keys at Risk" indicator when available count is below a threshold
- Clean up the tab header spacing for consistency with other pages

---

## 4. Operations (Building Issues) Page Revamp

**Current state:** 837-line monolith. The Issues and Maintenance sub-tabs use legacy colored-background cards (red/orange/blue/green fills) instead of the `StatusCard` pattern.

**Changes:**
- Replace all colored-background stat cards in the Issues tab (lines 584-629) with `StatusCard` components
- Replace all colored-background stat cards in the Maintenance tab (lines 721-755) with `StatusCard` components
- Replace the Overview tab's maintenance sidebar colored cards (lines 529-542) with `StatusCard`
- This brings the entire page in line with the design system

---

## 5. Access & Assignments Page Revamp

**Current state:** Already uses `StatusCard` for stats. The personnel cards are functional but basic.

**Changes:**
- Add a color-coded role badge to each `PersonnelCard` based on the design system (Justice/Blue, Clerk/Purple, Admin/Red, Aide/Green, Management/Amber) when title/department info is available
- Add a subtle status indicator for unassigned personnel (no rooms, no keys) with a muted warning border
- Improve the search bar with a count badge inline

---

## Summary of Changes

| Area | What Changes |
|------|-------------|
| Navigation & Heading | "Operations" renamed to "Building Issues" everywhere in UI |
| Lighting Dashboard | Plain cards to `StatusCard`, add health progress bar |
| Keys Statistics | Plain cards to `StatusCard` with semantic variants |
| Building Issues (Operations) | All colored-fill stat cards to `StatusCard` pattern in Issues, Maintenance, and Overview tabs |
| Access & Assignments | Role-colored badges on personnel cards, unassigned indicators |

Files to modify:
- `src/components/layout/config/navigation.tsx`
- `src/components/layout/utils/navigationPaths.ts`
- `src/pages/Operations.tsx`
- `src/components/lighting/new/overview/LightingDashboard.tsx`
- `src/components/keys/KeyStatisticsCards.tsx`
- `src/pages/AccessAssignments.tsx`

