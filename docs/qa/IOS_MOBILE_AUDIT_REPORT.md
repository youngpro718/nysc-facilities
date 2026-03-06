# iOS Mobile Audit Report

## Scope
- Audit target: admin core flows on iPhone-sized viewports in Safari and installed standalone PWA mode.
- Surfaces reviewed: app shell, `/login`, `/install`, `/`, `/spaces`, `/operations`, `/access-assignments`, `/keys`, `/inventory`, `/lighting`, `/admin`, plus shared mobile sheets, drawers, dialogs, and navigation.

## Method
- Static source audit of the shared mobile shell, iOS/PWA configuration, and admin-route mobile components.
- Verification commands run locally:
  - `npm run typecheck` -> passed
  - `npm run build` -> passed, with an 8.63 MB main JS chunk and 17.8 MiB PWA precache

## Constraint
- This environment does not have an iOS device, Safari/WebKit runtime, or local browser automation installed.
- Findings below are therefore source-backed and high-confidence where behavior follows directly from the implementation, but they are not accompanied by live iPhone screenshots or recordings.

## Findings

### 1. P1: Mobile menu sheet does not fully modalize the page
- Confidence: high
- Route and mode: app shell on all admin routes, Safari and standalone PWA
- Device/orientation: all iPhone portrait and landscape sizes
- Reproduction steps:
  1. Open the mobile menu from the header.
  2. Tap or attempt to scroll the dimmed page behind the sheet.
- Expected: the overlay should block interaction with the background while the menu is open.
- Actual: the sheet overlay is rendered with `pointer-events-none`, so background taps and scroll gestures can leak through.
- Likely root-cause area:
  - `src/components/ui/sheet.tsx`
  - The overlay at line 80 explicitly disables pointer events.
- Recommended fix direction:
  - Make the sheet overlay interactive and ensure background scroll is locked while any mobile sheet is open.
  - Re-test the mobile menu and any other `Sheet` consumers in Safari and standalone mode.

### 2. P2: `/spaces` mobile detail flows are likely to clip content on iPhone
- Confidence: high
- Route and mode: `/spaces`, Safari and standalone PWA
- Device/orientation: strongest risk on iPhone SE-size, 390x844, and 430x932 portrait
- Reproduction steps:
  1. Open `/spaces` on a phone-sized viewport.
  2. Open a room detail drawer.
  3. Navigate within the room card, especially deeper sections or destructive actions.
  4. Open room inventory from mobile.
- Expected: the drawer/dialog body should flex to the available visual viewport and remain fully scrollable above the home indicator.
- Actual: the room drawer and inventory dialog are both hard-capped with fixed `vh`/`dvh` heights and nested `overflow-hidden`, which makes clipped or unreachable content likely on short screens and during browser-chrome changes.
- Likely root-cause area:
  - `src/components/spaces/rooms/components/MobileRoomDrawer.tsx`
  - `src/components/spaces/rooms/components/MobileInventoryDialog.tsx`
- Recommended fix direction:
  - Replace fixed-height shells with a flex column layout and a dedicated scrollable body.
  - Add safe-area-aware bottom padding to the interactive content region instead of relying on a fixed inner height.

### 3. P2: `/keys` lockbox list uses `100vh` math that will drift on iOS Safari
- Confidence: high
- Route and mode: `/keys` lockbox tab, Safari and standalone PWA
- Device/orientation: portrait on iPhone-sized screens
- Reproduction steps:
  1. Open `/keys`.
  2. Stay on the default lockbox view.
  3. Scroll until Safari chrome expands/collapses, or relaunch in standalone mode.
- Expected: the lockbox list should fill the remaining visible viewport consistently and keep the bottom rows reachable.
- Actual: the container height is computed from `calc(100vh - 350px)`, which is unstable on iOS when the browser chrome changes height and does not account for the bottom tab bar or home indicator.
- Likely root-cause area:
  - `src/components/keys/lockbox/LockboxView.tsx`
- Recommended fix direction:
  - Move the page to a flex layout that measures available space without `100vh`.
  - If an explicit height is still required, use `dvh`/`svh` plus safe-area-aware padding instead of `100vh`.

### 4. P2: `/lighting` mobile detail dialogs are not safe-area or visual-viewport aware
- Confidence: high
- Route and mode: `/lighting`, Safari and standalone PWA
- Device/orientation: portrait; keyboard-open states are highest risk
- Reproduction steps:
  1. Open `/lighting` on mobile.
  2. Open a fixture details modal.
  3. Scroll long content or trigger any input/edit flow.
- Expected: details dialogs should size to the current visual viewport, keep the close control reachable, and preserve scroll access when the keyboard or Safari chrome changes.
- Actual: the mobile details dialog uses `90vh` and `calc(90vh - 140px)` without safe-area compensation, which makes clipping and awkward scroll boundaries likely on iPhone.
- Likely root-cause area:
  - `src/components/mobile/MobileDetailsDialog.tsx`
- Recommended fix direction:
  - Convert the dialog to a flex column using `dvh`/`svh` sizing and safe-area-aware padding.
  - Reuse the same mobile modal sizing rules across Lighting, Spaces, and Inventory to avoid divergence.

### 5. P2: Core entry surfaces still rely on `min-h-screen` (`100vh`) instead of visual-viewport sizing
- Confidence: high
- Route and mode: `/login`, `/install`, authenticated shell; Safari and standalone PWA
- Device/orientation: all portrait sizes; especially noticeable when Safari chrome expands/collapses
- Reproduction steps:
  1. Load `/login` or `/install` in iPhone Safari.
  2. Scroll enough to trigger browser-chrome changes.
  3. Compare with installed standalone mode.
- Expected: the page should track the visible viewport and avoid jumpy whitespace or hidden content under fixed controls.
- Actual: several core containers still use `min-h-screen`, which maps to `100vh` rather than the changing visual viewport and can produce height drift on iOS.
- Likely root-cause area:
  - `src/components/layout/Layout.tsx`
  - `src/pages/LoginPage.tsx`
  - `src/pages/InstallApp.tsx`
- Recommended fix direction:
  - Standardize on `min-h-[100dvh]` or `min-h-svh` for mobile shells and entry pages.
  - Audit other `min-h-screen` usages after the shared shell is corrected.

### 6. P3: Mobile navigation active state is wrong for query-param routes like Issues and Maintenance
- Confidence: high
- Route and mode: app shell navigation for `/operations?tab=issues` and `/operations?tab=maintenance`
- Device/orientation: all iPhone portrait and landscape sizes
- Reproduction steps:
  1. Navigate to a query-driven route such as `/operations?tab=issues`.
  2. Observe the bottom tab bar or the mobile menu state.
- Expected: the current destination should render as active in mobile navigation.
- Actual: the route map includes query strings, but the active-state checks compare only `location.pathname`, so those destinations will not highlight correctly.
- Likely root-cause area:
  - `src/components/layout/utils/navigationPaths.ts`
  - `src/components/layout/components/BottomTabBar.tsx`
  - `src/components/layout/components/MobileNavigationGrid.tsx`
- Recommended fix direction:
  - Normalize navigation to route ids or compare pathname plus search params explicitly.
  - Add a mobile nav regression test for query-driven tabs.

### 7. P2: Mobile startup cost is too high for a strong iPhone-first experience
- Confidence: high
- Route and mode: all routes, Safari and standalone PWA
- Device/orientation: all iPhone sizes; most visible on cold start or slower networks
- Reproduction steps:
  1. Run a production build.
  2. Review generated bundle sizes and PWA precache footprint.
- Expected: route transitions and first launch should be reasonably segmented for mobile delivery.
- Actual: the production build emits an 8.63 MB main JS bundle and a 17.8 MiB precache, which is a significant payload for mobile Safari and installed-PWA update cycles.
- Likely root-cause area:
  - Route-level code splitting is minimal.
  - Large admin subsystems are landing in the main application bundle.
- Recommended fix direction:
  - Add route-level lazy loading for large admin modules.
  - Split modal-heavy and rarely used flows out of the initial bundle.
  - Trim the PWA precache to the minimum needed for offline behavior.

## Summary
- Highest-risk shell issue: the mobile menu sheet does not fully block background interaction.
- Highest-risk route issues: `/spaces`, `/keys`, and `/lighting` all contain mobile containers that still depend on fixed viewport math.
- Highest-risk platform issue: the app mixes iOS-safe `dvh` usage with older `vh`/`min-h-screen` sizing, so viewport behavior will be inconsistent across Safari and standalone PWA mode.
- Highest-risk non-layout issue: the production payload is large enough to materially hurt mobile load and update experience.
