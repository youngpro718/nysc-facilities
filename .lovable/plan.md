# Standard User UX + Perceived Performance — SHIPPED

Audit and improvements for the standard-user experience.

## Summary of what shipped

### Phase 1 — Perceived performance (shipped)
- `TopProgressBar` global YouTube-style 2px loading bar (route + query activity).
- `RouteSkeleton` layout-aware Suspense fallback (no more white flash).
- `prefetchRoute()` helper — warms lazy chunks on hover/focus.
- Prefetch wired into `BottomTabBar`, `MobileNavigationGrid`, `AppSidebar`, and dashboard quick-action buttons.
- Friendly status labels (`statusLabels.ts`) — "Sent", "Being prepared", "Ready to pick up", "Done".

### Phase 2 — UX polish + tests (shipped)
- `OnboardingHintStrip` — dismissible 3-card welcome strip on the dashboard.
- `StatusLegendPopover` — info popover that explains every status pill.
- Soft gradient greeting card on the dashboard (matches Building Card aesthetic).
- Standardized vertical rhythm (`space-y-6`) on the dashboard.
- CTA copy standardized: "Order Supplies", "Make a Request", "Request a Key".
- Unit tests (Vitest) for `TopProgressBar`, `RouteSkeleton`, `statusLabels`, `prefetchRoutes`.
- E2E spec (`perceived-performance.spec.ts`) for shell continuity, skeletons, and prefetch.

## Out of scope (potential follow-ups)
- Animated route transitions with framer-motion `AnimatePresence`.
- Service-worker caching of API responses for offline use.
- Backend query-latency tuning + DB index review.
- Onboarding hint dismissal in `user_preferences` table (currently localStorage).
