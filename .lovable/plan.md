
# Finish the Perceived-Performance Audit: Tests + Remaining UX Polish

This plan closes out everything we deferred from the original audit: automated tests for the new loading/perf primitives, plus the UX items in the audit that we never shipped (skeletons on more pages, prefetch on remaining nav, onboarding hints, copy standardization, status legend).

## 1. Unit tests (Vitest + React Testing Library)

The testing harness already exists (`vitest.config.ts`, `src/test/setup.ts`). We add focused tests for the new primitives so timing regressions get caught.

- `src/components/ui/__tests__/TopProgressBar.test.tsx`
  - Hidden by default (opacity-0).
  - Becomes visible on route change and jumps to >=25%.
  - While `useIsFetching` > 0, progress trickles upward but never reaches 100.
  - When fetching ends, progress hits 100 then hides after the hide delay.
  - Rapid route changes never regress progress backward.
  - Safety timeout force-hides after 30s of stuck-visible state (use `vi.useFakeTimers`).
  - Cleans up all timers on unmount (no act() warnings, no leaked intervals).
- `src/components/ui/__tests__/RouteSkeleton.test.tsx`
  - Renders header/list/stat placeholders; no `animate-spin` present.
  - Respects `variant` prop (dashboard / list / detail) if implemented.
- `src/lib/__tests__/statusLabels.test.ts`
  - Every internal status maps to a friendly label + tone.
  - Unknown status falls back gracefully (returns the raw key, neutral tone).
- `src/lib/__tests__/prefetchRoutes.test.ts`
  - Calls the registered loader exactly once per path (dedupes).
  - Uses `requestIdleCallback` when available, falls back to `setTimeout`.
  - Swallows loader rejections without throwing.

Mocking notes: wrap components needing router in `MemoryRouter`; wrap query-dependent ones in a fresh `QueryClientProvider`. Use `vi.useFakeTimers()` for all timing assertions.

## 2. E2E loading checks (Playwright)

Project already has `playwright.config.ts` and an `agent-user.spec.ts`. Add one focused spec.

- `tests/e2e/perceived-performance.spec.ts` (standard user)
  - Sign in, land on `/`, assert top progress bar element exists in DOM.
  - Navigate `/` → `/request/supplies` → `/my-issues` → `/notifications` and for each:
    - The persistent shell (sidebar/bottom tab) stays mounted (no full white flash).
    - A skeleton element (`[data-testid="route-skeleton"]`) appears before content.
    - Generic `.animate-spin` is NOT used at the page level (only allowed inside buttons).
  - Hovering a bottom-tab item triggers a chunk request (assert via `page.waitForRequest` matching `/assets/*.js`) BEFORE the click.
  - Throttle network to "Slow 3G" via CDP and verify the progress bar reaches visible state within 200ms of click.

Add `data-testid="route-skeleton"` to `RouteSkeleton.tsx` and `data-testid="top-progress-bar"` to `TopProgressBar.tsx` to make these assertions stable.

## 3. Remaining UX items from the original audit

These were in the approved plan but never implemented:

### 3a. Skeletons on the remaining standard-user pages
Replace page-level `animate-spin` with shared skeletons in:
- `src/features/issues/pages/MyIssues.tsx` → `CardListSkeleton`
- `src/features/supply/pages/MySupplyRequests.tsx` → `CardListSkeleton`
- `src/features/dashboard/pages/Notifications.tsx` → `SkeletonList`
- Any `My*` page still using a centered spinner (sweep with `rg "animate-spin" src/features` and fix page-level uses; keep button-loading spinners).

### 3b. Prefetch on the remaining nav surfaces
We added prefetch to `BottomTabBar` and `MobileNavigationGrid`. Still missing:
- `src/components/layout/components/DesktopNavigation.tsx` — `onPointerEnter` / `onFocus` → `prefetchRoute(item.path)`.
- `src/components/layout/components/AppSidebar.tsx` — same pattern on each `<NavLink>`.
- Dashboard quick-action buttons in `UserDashboard.tsx` (Order Supplies, Report Issue, Request Key) — prefetch their destinations.

### 3c. First-time-user clarity
- `src/features/dashboard/components/dashboard/OnboardingHintStrip.tsx` (new): 3-card dismissible strip ("Order supplies", "Report an issue", "Track your requests"). Mounted in `UserDashboard` when `useOnboardingChecklist` reports the user hasn't dismissed it. Persist dismissal in `user_preferences` (existing table).
- Standardize CTA copy across the app to: **Order Supplies**, **Report an Issue**, **Request a Key**. Sweep with `rg "Request Supplies|Get Supplies|New Issue|New Request"` and align.
- `src/components/ui/StatusLegendPopover.tsx` (new): tiny popover triggered by an info icon next to status pills, listing each status + color + plain-language meaning. Drive from `statusLabels.ts` so it stays in sync.

### 3d. Aesthetic refinements (audit section 5)
- Soft gradient card behind the dashboard greeting (matches the Building Card design memory).
- Standardize vertical rhythm to `space-y-6` between major dashboard sections.
- Add `animate-fade-in` on skeleton-to-content swaps (already in tailwind config).

## 4. Documentation + cleanup

- Update `.lovable/plan.md` to mark sections 3, 4, 5 as shipped.
- Add a short note to `docs/QUICK_REFERENCE.md` about: the progress bar, the `prefetchRoute()` helper, and the `getStatusLabel()` helper, so future contributors use them instead of rolling their own.

## Technical details

**New files**
- `src/components/ui/__tests__/TopProgressBar.test.tsx`
- `src/components/ui/__tests__/RouteSkeleton.test.tsx`
- `src/lib/__tests__/statusLabels.test.ts`
- `src/lib/__tests__/prefetchRoutes.test.ts`
- `tests/e2e/perceived-performance.spec.ts`
- `src/features/dashboard/components/dashboard/OnboardingHintStrip.tsx`
- `src/components/ui/StatusLegendPopover.tsx`

**Modified files**
- `src/components/ui/TopProgressBar.tsx`, `src/components/ui/RouteSkeleton.tsx` — add `data-testid` attrs.
- `src/components/layout/components/DesktopNavigation.tsx`, `AppSidebar.tsx` — prefetch hooks.
- `src/features/issues/pages/MyIssues.tsx`, `src/features/supply/pages/MySupplyRequests.tsx`, `src/features/dashboard/pages/Notifications.tsx`, `src/features/dashboard/pages/UserDashboard.tsx` — skeletons + prefetch + hint strip + gradient card + copy standardization.
- `.lovable/plan.md`, `docs/QUICK_REFERENCE.md`.

**No DB changes. No new dependencies** — Vitest, RTL, and Playwright are already configured.

## Out of scope
- Animated route transitions (framer-motion `AnimatePresence`).
- Service-worker API response caching.
- Backend query-latency tuning / index review.

Approve to implement everything above in one pass.
