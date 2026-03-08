

# Comprehensive App Audit: NYSC Facilities Management

---

## 1. LAYOUT & STRUCTURE ISSUES

### 1A. Redundant Page Headers
Multiple pages render their own "back button + title" header (Profile, AdminCenter, SystemSettings, MyActivity, RequestHub) **on top of** the global sticky header that already shows the page title derived from the URL path. This creates double headers — the global one says "Profile" and then below it the page says "Profile & Settings" with another back button. On mobile, this wastes ~90px of precious vertical space.

**Fix**: Remove per-page headers on pages where the global header already shows the correct title, or hide the global header title when the page provides its own.

### 1B. Inconsistent Page Padding/Containers
- `SupplyRoom` wraps content in `<div className="container mx-auto px-4 py-8">` — duplicating padding from Layout's `<main>` wrapper (`px-2 sm:px-4 lg:px-8`), causing double padding on desktop.
- `AccessAssignments` uses `<div className="container mx-auto py-6 px-4">` — same problem.
- `AdminCenter` and `Profile` use `px-3 sm:px-0` — inconsistent with other pages.
- `RequestHub` uses `<div className="container max-w-2xl mx-auto px-4 py-6">` — triple padding on larger screens.

**Fix**: Standardize — either pages provide their own padding and Layout's `<main>` provides none, or vice versa. Currently it's mixed.

### 1C. Main Content `paddingBottom` Override Conflict
`Layout.tsx` line 222 sets `style={{ paddingBottom: 'max(7rem, ...)' }}` — this inline style **always wins** over the `md:pb-0` Tailwind class. On desktop (where there's no bottom tab bar), the page has 112px of empty space at the bottom for no reason. The `md:pb-0` is dead code.

**Fix**: Wrap the inline style in a conditional or use a CSS media query so it only applies on mobile.

---

## 2. MOBILE UX ISSUES

### 2A. Sheets/Drawers Getting Cut Off
- `IssueDialogManager` opens a `SheetContent side="right"` with `className="w-full sm:w-3/4"`. The sheet component already has `w-full sm:w-3/4` in its variant. These stack — but more critically, the sheet's close button uses `top: calc(env(safe-area-inset-top) + 8px)` while the sheet content itself has `pt-[env(safe-area-inset-top)]`. The close button may overlap the sheet header content if both paddings are present.
- `CreateSessionDialog` sets `paddingBottom: '20vh'` inline — this is a hack suggesting content was getting cut off. The root cause is likely the sheet not accounting for the bottom safe area.
- `MobileRequestForm` uses `h-[90vh]` which on iOS doesn't account for the URL bar or safe areas — should use `h-[90dvh]`.
- Bottom sheets (`side="bottom"`) use fixed heights like `h-[85vh]`, `h-[80vh]` — should all use `dvh` units on mobile.

### 2B. Bottom Tab Bar Overlap
The BottomTabBar is fixed at `bottom: 0` with `z-40`. The FAB is at `bottom-28` (`112px`). However:
- `MyActivity` page has `pb-20 md:pb-8` — only 80px padding, which is less than the tab bar + safe area (~82px+). Content may be hidden.
- `UserDashboard` has `pb-20` — same issue.
- `AdminCenter` has `pb-20` — same.
- The global Layout already handles padding, so these per-page `pb-20` values fight with the Layout's `pb-28` + inline style.

**Fix**: Remove per-page bottom padding entirely and rely on Layout's padding. Or if pages need extra, coordinate with the Layout value.

### 2C. MyActivity Stats Grid on Small Screens
The stats grid uses `grid-cols-4` on all screen sizes. On a 375px wide phone, each card is ~85px wide — the icon, badge, and "Supplies" label barely fit. The `p-4` padding makes it cramped.

**Fix**: Use `grid-cols-2 sm:grid-cols-4` for the stats cards.

### 2D. Mobile Menu Opens from Wrong Side
The hamburger menu button is in the **left** side of the header (`md:hidden mr-2`), but the sheet opens from the **right** (`side="right"`). This is disorienting — users expect left-side menus when the trigger is on the left.

### 2E. Horizontal Scroll on Keys Page
The `TabsList` on Keys page has 6 tabs in an `overflow-x-auto` container. On mobile this creates a horizontal scrollbar but there's no visual indicator that more tabs exist. Users may not discover the "Manage" or "Passes" tabs.

---

## 3. NAVIGATION & INFORMATION ARCHITECTURE

### 3A. Admin Navigation Has "Issues" but Route Points to "Operations"
The admin sidebar shows "Issues" (`{ title: 'Issues', icon: AlertTriangle }`) but the route maps to `/operations` which is a full Operations hub with tabs for Overview, Issues, and Maintenance. The nav label is misleading — it should say "Operations" to match the page title.

### 3B. Redundant "Admin Center" and "Users" Pages
- `/admin` (AdminCenter) is a full user management page.
- `/users` (Users) also exists as a route but isn't in any navigation — it may be a dead page. Check if it's still needed or should be removed.

### 3C. Settings Fragmentation
Admin settings are split across 3 locations:
1. **Profile page** → has a card linking to Admin Center and System Settings
2. **Admin Center** (`/admin`) → user management
3. **System Settings** (`/system-settings`) → modules, database, QR code

These are not connected in the sidebar — Admin Center is the only one in the sidebar nav. System Settings is only reachable through the Profile page link card. This is hard to discover.

**Fix**: Either add System Settings to the sidebar, or merge it into Admin Center as a tab.

### 3D. Notification Redundancy
- The header has a `NotificationBox` (admin-only).
- The bottom tab bar includes "Notifications" in the navigation for non-admin roles.
- There's a dedicated `/notifications` page that just renders `<NotificationBox />`.
- Standard users see "Notifications" in their nav but the NotificationBox component may be admin-focused.

### 3E. Request Hub vs Dashboard Quick Actions Duplication
The `UserDashboard` has 4 quick action buttons (Order Supplies, Request Help, Report Issue, Request Key). The `RequestHub` (`/request`) has the exact same 4 actions as cards. The FAB navigates to `/request`. This means the same functionality exists in 3 places.

---

## 4. VISUAL & DESIGN ISSUES

### 4A. Spaces Page Looks Empty
The `Spaces` page has a header with just a "Create Space" button (hidden on mobile), then `<SpacesTabs />`. There's no page title or description visible — the global header shows "Spaces" but the page body jumps straight into tabs. Every other admin page has a title + subtitle pattern. This looks inconsistent.

### 4B. Operations Page is Overly Dense
The Operations page has: breadcrumb + title bar + building filter bar + 4 KPI cards + 3-tab interface + each tab has its own cards, grids, and actions. On mobile, the user has to scroll through ~600px of chrome before reaching actual content in the tabs. The "Overview" tab duplicates information already shown in the KPI strip above the tabs.

**Fix**: Consider removing the Overview tab (it's redundant with the KPI strip) and making Issues the default tab. Move Quick Actions into a compact toolbar.

### 4C. Inconsistent Card Styles
- `AdminCenter` uses `<Card className="p-4">` for user rows.
- `MyActivity` uses `<Card><CardContent className="p-4">` for request items.
- `AccessAssignments` uses `<Card><CardContent className="p-2.5 sm:p-4">` for person cards.
- Some pages use the `StatusCard` component, others use raw Card + manual styling.

### 4D. Dark Theme Issues
The login page forces `className="light"` on its container, but the `LoginPage` watermark image may not have dark mode handling. If the user's system theme is dark, navigating from login to the app causes a jarring flash from light to dark.

---

## 5. FUNCTIONAL ISSUES

### 5A. Dead Routes
- `/users` — has a route but no sidebar/nav link. May be unreachable.
- `/form-templates`, `/form-intake` — in the route config and `userNavigationItems` but not in the role-based `getRoleBasedNavigation()` for any role. Users can't navigate to them without direct URL.
- `/admin/form-templates` (Form Builder) — same, only in `userNavigationItems` but not in the role-based nav.

### 5B. Sheet Close Button Accessibility
The sheet close button (`SheetPrimitive.Close`) has `min-h-[44px] min-w-[44px]` (good touch target), but its position uses `right-3` (12px from edge). On iOS with the sheet at full width, this puts it very close to the screen edge — may conflict with the iOS swipe-from-edge gesture.

### 5C. `window.confirm()` for Destructive Actions
`AdminCenter` uses `window.confirm()` for delete actions (lines 493, 571). This is a blocking browser dialog that looks out of place in a modern app. Other places (like RoomsPage) correctly use `AlertDialog`. This should be standardized.

### 5D. Supply Room Double Container
`SupplyRoom` wraps everything in `<div className="container mx-auto px-4 py-8">` plus `<Breadcrumb />`. But Layout already provides container padding. The `Breadcrumb` component is also used in Operations — check if the breadcrumb is redundant with the global header title.

---

## 6. PERFORMANCE CONCERNS

### 6A. AdminCenter Fetches All Users Client-Side
The `loadUsers()` function fetches all profiles and all user_roles, then does client-side filtering. For a growing user base this won't scale. Should paginate server-side.

### 6B. GlobalKPIStrip Makes 4 Parallel Queries
Each loads full result sets from `issues`, `lighting_fixtures`, `supply_requests`. These should use `count` aggregation instead of fetching full rows.

---

## 7. PRIORITY RECOMMENDATIONS

High priority (directly impacts usability):
1. Fix the `md:pb-0` dead code on desktop — remove inline style on desktop via media query
2. Standardize page padding — pick one approach (Layout provides it or pages provide it)
3. Fix MyActivity stats grid to `grid-cols-2` on mobile
4. Rename sidebar "Issues" to "Operations"
5. Make System Settings discoverable (add to sidebar or merge into Admin Center)
6. Replace `vh` with `dvh` in all mobile bottom sheets
7. Remove redundant per-page headers where global header suffices

Medium priority (polish):
8. Fix mobile menu direction (left trigger → left sheet)
9. Replace `window.confirm()` with AlertDialog in AdminCenter
10. Add horizontal scroll indicators on Keys tabs
11. Remove or consolidate dead routes
12. Deduplicate Request Hub vs Dashboard quick actions

Lower priority (optimization):
13. Paginate AdminCenter user list
14. Use count queries for GlobalKPIStrip
15. Consolidate notification patterns

