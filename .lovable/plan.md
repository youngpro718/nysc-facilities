# Design & UX Audit — NYSC Facilities

I went through the design tokens, layout shell, sidebar, top header, mobile bottom tab, FAB, the Admin/User dashboards, the Operations hub, the Keys page, and a sample of cards/widgets. Here's what I found and what I'd fix, organized by severity. At the end is a phased plan you can approve in pieces.

---

## A. What's working well

- **Strong foundation**: solid design-token file (`design-tokens.css`), a real `StatusCard` primitive, semantic statuses (`status-critical/warning/operational/info/neutral`), a clean collapsible sidebar, mobile-first surfaces (BottomTabBar, FAB, MobileKeyManagement after the recent cleanup).
- **Light / dark / blue / green / purple themes** all wired to HSL tokens correctly.
- **iOS standards** (safe-area, 44px targets, `h-dvh`) are codified.
- **Admin Command Center** has the right *information architecture* (KPIs → secondary metrics → activity → quick actions).

---

## B. The biggest design problems (ranked)

### 1. Two parallel design systems are fighting each other
Components either use the **semantic token system** (`text-foreground`, `bg-card`, `text-status-critical`, `StatusCard`) or **raw Tailwind colors** (`bg-orange-100`, `border-red-200`, `text-orange-600`, hard-coded hex in glow keyframes).

Examples found:
- `Operations.tsx`: `border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30` on stat cards while right above them `StatusCard` is used correctly with `statusVariant`.
- `CommandCenter.tsx`: `bg-orange-100 dark:bg-orange-950 text-orange-600` in the activity list, while KPIs above use `StatusCard`.
- `TaskCard.tsx`: hard-coded `border-l-slate-400`, `border-l-blue-500`, `border-l-orange-500`, `border-l-red-500` for priority — bypasses the priority memory ("Priorities = solid color dots; tinted pill badges for status").
- 25+ `.tsx` files use raw `bg-(orange|green|blue|red|yellow|purple)-(50|100|200)`.
- Legacy `--lighting-*` tokens duplicate `--status-*` (same HSL values).

**Effect:** the "green text everywhere" feeling you reported on the Keys page exists across the app — same root cause. Color drifts subtly between modules; theme switches (blue/green/purple) only re-style the semantic side, leaving raw colors unchanged.

### 2. Page header pattern is inconsistent
There are **at least four** ways pages declare a title:
- `<PageHeader />` primitive (well designed, almost unused).
- The Layout's auto-derived `getPageTitle()` slug-cased title in the top bar.
- Per-page `<h1 className="text-xl sm:text-2xl font-bold">` blocks (Keys, UserDashboard, Spaces).
- Per-page `<h2 className="text-3xl">` blocks with their own description + action row (Operations, CommandCenter).

So the user sees a redundant title twice (once in the header strip, once in the page body) and font sizes shift between pages. AdminDashboard uses `AdminGreeting`, Operations uses an inline h2, Keys uses inline h1 — each with its own gap, spacing, badge/button placement.

### 3. Information overload on the Admin landing page
`AdminDashboard` stacks: AdminGreeting → ProductionSecurityGuard → BuildingsGrid (2 large photo cards) → CommandCenter (4 KPIs + 3 metric cards + 8 activity items + 4 big quick-action tiles). That's roughly **22 actionable surfaces** above the fold area. The "Quick Actions" card at the bottom partially duplicates the Command Center sidebar links, and "View All / View Operations / Manage Users" CTAs appear three times each. Cognitive load is high.

### 4. Color logic for status is partly inverted / partly correct
- Building card: `Operational` uses `Badge variant="default"` which renders **dark/neutral**, while `Maintenance` uses `destructive` (red). So a healthy building shows a *darker* badge than a problematic one — but neither uses the green operational token. Should use the StatusCard color language (green dot for operational, red for maintenance) consistently.
- "Health %" cell uses `>=90` operational, `>=70` warning, else critical, but the card's status badge above doesn't pull from the same threshold.

### 5. Mobile bottom tab bar + FAB compete for attention
- BottomTabBar is `bottom-0`, FAB sits at `bottom-28` — that's ~7rem above the bar with another 5rem of `mobile-main-padding` reserved. Visually the FAB floats in the middle of the content scroll area on shorter screens.
- FAB is hidden on `/spaces`, `/profile`, `/settings`, `/admin`, `/forms/`, `/login`, `/auth/`, `/onboarding/`, `/request/` — that's most of the app. So a user learns to tap it on the dashboard, then it disappears with no indication.
- "Request Key" in the FAB navigates to `/my-requests?new=1`, while "Order Supplies" navigates to a dedicated flow. Action targets are inconsistent.

### 6. Hidden admin routes still exposed in UI
- `Quick Actions` → "System Settings" → `/admin/settings` (route doesn't exist; redirects to `/admin?tab=system`).
- "View Analytics" → `/admin/analytics` (no route).
- "View All" → `/admin/alerts` (no route).
- `BuildingsGrid` → "View" issues banner navigates to `/operations?building=…&filter=active` (works) but the building card itself navigates to `/spaces?building=…` (works) — fine, but the secondary "Issues" CTA is the only visible affordance for the issue link, so users miss it.

### 7. Operations page is doing too much
~600 lines, four tabs (Overview / Issues / Maintenance / Lighting), each with its own stats grid that *overlaps* the page-level stats grid. There's a top-level KPI strip with "Active Issues / In Progress / Resolved Today / Maintenance Queue", then the Issues tab repeats with its own colored cards for the same numbers. Building filter pills at the top can wrap to 3 lines on narrow widths. Two refresh buttons (top-right and inside Issues tab).

### 8. Typography / spacing drift
- Page titles range from `text-xl` → `text-2xl` → `text-3xl` → `text-[length:var(--text-page-title)]` across pages.
- Card section gaps range from `space-y-4` → `space-y-5` → `space-y-6` → `space-y-8` between modules.
- `density-compact/comfortable/spacious` tokens are defined but **never consumed** anywhere — settings UI lets users pick density that does nothing.

### 9. Empty states and loading states aren't unified
- `EmptyState`, `LoadingState`, `SkeletonCard`, `DataState` primitives exist, but most pages roll their own (`<Loader2 />` centered, custom "no buildings found" text, custom `KeyRound` empty in mobile keys, custom skeleton arrays).

### 10. Smaller polish items
- `index.css` `.blue / .green / .purple` themes have washed-out backgrounds and don't redefine `--card`, `--popover`, `--surface`, etc — switching to them produces broken cards (still using default white).
- `--font-family-sans` declares Inter but Inter isn't loaded via `@import` or `<link>` — falls back to system-ui silently.
- `noscript` fallback rules and PWA install banner can stack with DevModeBanner + permission error banner = up to 4 horizontal banners stacking on top of header.
- `Operations` "Live" badge is decorative; doesn't reflect realtime connection state.
- Some tap targets in the top header on mobile are 32×32 (below the 44px standard) — search button and theme toggle.
- `ChevronRight` icons appear on cards, action rows, activity items, list rows — reading "tap me" three different ways on a single screen.

---

## C. UX / functional issues

1. **Refresh buttons everywhere.** Layout has one (skeleton refresh), AdminGreeting has one, CommandCenter has one, Operations has two. Pull-to-refresh exists only on UserDashboard. → unify on **PullToRefresh on mobile + a single header refresh button on desktop**, drop in-card refresh buttons.

2. **No global empty/error voice.** Network errors fall through to either a sonner toast, an Alert banner, an inline message, or silent failure depending on the page.

3. **Search affordance.** ⌘K palette is admin-only; non-admins have no global search even though they have many pages.

4. **Notifications surface.** `NotificationBox` (admin) + `NotificationDropdown` (user) are different components with different visual languages — bell icon, but different popover sizing, different empty state, different "mark all read" placement.

5. **Profile vs Settings ambiguity.** Settings, theme, security all redirect to `/profile?tab=settings`. The sidebar still calls it "Profile" only, hiding the settings entry point. Users hunt for theme/2FA in a "Profile" page.

6. **Building filter on Operations** uses "All Buildings" + dynamic pills. With 5+ buildings this wraps and pushes the KPI strip down. A `Select` dropdown is more compact and matches how the rest of the app filters.

7. **Tasks/Supply badges** on the bottom tab bar use `variant="destructive"` (red) for *count badges*, which conflicts with the "red = critical/error" status language. They should be `secondary` neutral pills.

8. **Onboarding wizard** triggers inside the layout for first-time users but has no skeleton beneath it, so the user sees the dashboard half-rendered behind it.

---

## D. Phased fix plan

I'd attack this in **four small, reviewable phases** so nothing breaks at once. You can approve them one at a time.

### Phase 1 — Color & token unification (highest impact, lowest risk)
- Add semantic tokens for **soft tints** (`--surface-critical`, `--surface-warning`, `--surface-operational`, `--surface-info`) so the activity list / Operations Issues tab / TaskCard priority borders all use tokens instead of `bg-orange-100 / border-red-200`.
- Refactor the 25 files using raw `bg-(color)-100/200/50` to use the new tokens.
- Delete duplicate `--lighting-*` tokens, alias them to `--status-*`.
- Fix the `.blue / .green / .purple` themes to redefine `--card`, `--popover`, `--surface`, `--border`, `--muted`, etc.
- Wire `--font-family-sans` (Inter) properly via Google Fonts `<link>` in `index.html`.
- Change BottomTabBar count badges from `destructive` → `secondary`.

### Phase 2 — Layout & header consistency
- Adopt `<PageHeader />` everywhere; remove the per-page h1/h2 + description + action-row patterns. Pages: Operations, Keys, UserDashboard, Spaces, Tasks, Inventory, AccessAssignments.
- Decide the title-source: top header shows section name, page body shows `PageHeader` with description + actions. (Or remove the page-body title when the route is unambiguous like Dashboard.)
- Standardize page wrapper to `<PageContainer>` (already exists in `components/layout/`) with consistent vertical rhythm (`space-y-6` everywhere).
- Pull all "refresh" buttons into the header refresh slot (one per page).
- Wire density tokens (`density-compact/comfortable/spacious`) to actually drive `--card-padding` / `--section-gap`, or remove the setting.

### Phase 3 — Dashboard simplification
- **AdminDashboard**: collapse "Quick Actions" card into the secondary metrics row (each metric card gets a footer link), remove the duplicate CTAs. Move the activity list into a right-rail column so KPIs stay above the fold.
- **CommandCenter alerts banner**: keep critical, drop the parallel warning banner (warnings already show in the KPI subLabels).
- **BuildingCard**: switch to StatusCard color language — green operational dot, red maintenance dot, single threshold for badge + health cell. Remove the dynamic-photo behavior (it shows random issue photos as building hero — confusing) and use the building's own photo or a placeholder.
- **Operations**: extract the four tab contents into routes (`/operations/issues`, `/operations/maintenance`, `/operations/lighting`); remove the per-tab duplicate stats; collapse the 600-line file. Building filter → `Select`.

### Phase 4 — Mobile polish
- BottomTabBar + FAB: only show FAB on the actual dashboards (User & Admin) where there's no other primary CTA. On other pages the per-page header button is enough.
- Unify `NotificationBox` and `NotificationDropdown` into one `NotificationCenter` component with role-aware content.
- Add PullToRefresh to AdminDashboard, Operations, Keys mobile, Tasks.
- Raise mobile header tap targets to 44×44 (search, theme, avatar).
- Unify all empty / loading / error states on `EmptyState` + `LoadingState` + `DataState` (primitives already exist; just usage discipline).

---

## E. What I'd do *first* if you only approve one phase

**Phase 1** — it eliminates the "green text everywhere" problem app-wide (not just on Keys), takes the most files but the changes are mechanical, and it's the foundation for everything else. The visible win is consistent color across modules and theme switching that actually re-skins the whole app.

---

**Questions for you before I switch to default mode and start:**
1. Approve in **phases** (recommended) or do you want me to tackle the **whole audit** in one pass?
2. For the BuildingCard hero photo — keep dynamic issue photos, switch to a static building photo, or use a placeholder?
3. For Operations — okay to split into sub-routes (`/operations/issues` etc.), or keep tabs?