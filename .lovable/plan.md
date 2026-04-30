# Standard User UX Audit + Perceived-Performance Plan

## What I observed

**The "long wait" feeling is real, but mostly perceived.** The session replay shows the same generic loading spinner (`h-8 w-8 animate-spin`) appearing on every navigation. It's used in 3 places that a standard user hits constantly:

1. `src/App.tsx` line 103 — `RouteFallback` shown during lazy-loaded route chunks (between every page)
2. `src/features/dashboard/pages/UserDashboard.tsx` line 65 — full-page spinner while auth resolves
3. `src/features/supply/pages/MySupplyRequests.tsx`, `MyIssues.tsx`, etc. — page-level spinners while data loads

A spinner with no context tells the user "something is happening, but I don't know what or how long." Skeletons that match the final layout feel ~30% faster even when actual load time is identical (Nielsen/Google research). We already have great skeleton primitives (`SkeletonList`, `CardListSkeleton`, `DashboardSkeleton`, `BuildingCardSkeleton`) — they're just not used at the route boundary or auth boundary.

## Audit findings (first-time standard user)

**Strengths**
- `CompactHeader` greeting is warm and time-aware (Good morning, Jane)
- `PullToRefresh` on mobile is a nice touch
- Bottom tab bar + clear primary CTAs ("Order Supplies", "Report Issue")
- Empty states have icons + descriptions + actions

**Friction points**
1. **Generic spinner between every page** — feels like a 1990s loading screen, breaks the illusion of speed
2. **Two loading layers stack** — route chunk spinner → page spinner → data spinner (3 different "waits" back-to-back on first nav)
3. **No layout continuity** — header/sidebar disappear during route transitions on some screens, page "flashes" white
4. **No prefetching** — clicking a nav item starts the chunk download from scratch
5. **First-time clarity gaps** — Dashboard cards use status words like "submitted / picking / packing" that a new user won't recognize; no tooltip or legend
6. **Inconsistent CTAs** — "Order Supplies" vs "Request Supplies" vs "Get Supplies" used in different places

## Plan

### 1. Replace the generic route spinner with a layout-aware skeleton (biggest perceived win)

- Update `RouteFallback` in `src/App.tsx` to render the persistent shell (sidebar + header + bottom tab) and put a content-shaped skeleton in the main area. The user sees the same chrome they were just on, with placeholder content blocks pulsing in. No more white flash.
- Add a subtle top progress bar (`nprogress`-style, 2px primary-color bar) that appears whenever a route transition or major query is in flight. Hook it into React Router transitions + a global query subscription. This is the single most effective "feels faster" change.

### 2. Prefetch route chunks on hover/focus

- In `MobileNavigationGrid`, `BottomTabBar`, `DesktopNavigation`, and dashboard quick-action buttons, attach `onMouseEnter` / `onFocus` handlers that trigger the lazy `import()` for the destination. By the time the user clicks, the chunk is already in cache. Cuts ~200–500ms off most navigations with zero backend changes.

### 3. Replace per-page spinners with matching skeletons

- `UserDashboard.tsx` initial-auth spinner → render `CompactHeader` skeleton + 3 stat-card skeletons (already have `StatsCardsSkeleton`)
- `MyIssues`, `MyRequests`, `MyActivity`, `Notifications` → use `SkeletonList` / `CardListSkeleton` (already imported in some places, just standardize)
- Audit the 40 files using `animate-spin` and replace page-level uses; keep spinners only for inline button-loading states

### 4. First-time-user clarity polish

- **Plain-language status labels for standard users**: map internal statuses to friendly terms (`submitted` → "Sent", `picking` → "Being prepared", `ready` → "Ready to pick up", `fulfilled` → "Done"). Keep internal codes in the DB; only re-label in the UI.
- **Onboarding hint cards**: on first dashboard visit (detected via existing `useOnboardingChecklist`), show a dismissible 3-step "Here's what you can do" strip above the activity feed.
- **Standardize CTA copy**: pick one verb per action. Proposal: "Order Supplies", "Report an Issue", "Request a Key". Update all entry points.
- **Tooltip/legend** on status pills explaining what each color means (1-line popover on hover/long-press).

### 5. Aesthetic refinements

- Soften the dashboard with a subtle gradient background card behind the greeting (matches `building-card-design` memory)
- Increase vertical rhythm: `space-y-6` between major sections (currently mixed 4/6/8)
- Add `animate-fade-in` (already in tailwind config) to skeleton-to-content swaps so things don't pop in

## Technical details

**Files to add**
- `src/components/ui/TopProgressBar.tsx` — global progress bar component, mounted in `App.tsx` shell
- `src/components/ui/RouteSkeleton.tsx` — layout-aware fallback used by `<Suspense>`
- `src/lib/statusLabels.ts` — central map: internal status → user-facing label + color

**Files to modify**
- `src/App.tsx` — swap `RouteFallback`, mount `TopProgressBar`
- `src/features/dashboard/pages/UserDashboard.tsx` — replace auth spinner with skeleton
- `src/features/supply/pages/MySupplyRequests.tsx`, `MyIssues.tsx`, `MyRequests.tsx`, `Notifications.tsx`, `MyActivity.tsx` — use shared skeletons + new status labels
- Navigation components (`BottomTabBar`, `DesktopNavigation`, `MobileNavigationGrid`) — add prefetch-on-hover
- `EnhancedSupplyTracker`, supply/issue cards — consume `statusLabels.ts`

**No DB changes.** No new dependencies (we already have framer-motion, tailwind animations, react-query). Progress bar will be a ~30-line custom component, not a library.

## Out of scope (can be follow-ups)
- Actually reducing query latency (would need server-side caching / index review)
- Service-worker offline caching of API responses
- Animated page transitions (framer-motion `AnimatePresence` on routes)

If you approve, I'll implement all 5 sections in one pass.
