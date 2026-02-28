

## Cleanup Plan: 10 fixes across 4 files

### IMMEDIATE

**1. Remove `input:focus { transform: translateY(-50px) }` (breaks all forms on iOS)**

File: `src/styles/ios-compatibility.css`, lines 114-128. Delete the entire `@supports (-webkit-touch-callout: none)` block that contains both `.ios-keyboard-fix` and the destructive `input:focus` / `textarea:focus` transform rule.

**2. Remove `input:valid` / `input:invalid` global styling**

File: `src/styles/ios-compatibility.css`, lines 198-205. Delete the `input:invalid` and `input:valid` border-color rules entirely. These override Tailwind form styling on every input.

### HIGH

**3. Scope touch target CSS to utility classes**

File: `src/styles/ios-compatibility.css`, lines 95-111. The `@media (hover: none)` block currently applies `min-height: 44px; min-width: 44px` to every `button`, `a`, `input[type="button"]`, and `input[type="submit"]` globally. Replace with scoped utility classes:
- `.touch-target-44` for the min-height/min-width rule
- `.touch-padded` for the padding rule

This prevents layout breakage on small icon buttons and inline links.

**4. Clean up FAB overlap on mobile**

File: `src/components/ui/FloatingActionButton.tsx`, line 32. Change `bottom-24` to `bottom-20` so the FAB sits just above the mobile bottom nav without overlapping content. Add `safe-area-bottom` to respect the iOS home indicator.

**5. Remove double safe-area body padding**

File: `src/styles/ios-compatibility.css`. The body gets safe-area padding at line 15-20 **and** the `globals.css` also has safe-area utilities. The `body` block at lines 15-20 applies padding unconditionally to all four sides, which doubles up with any component using the utility classes. Remove the body padding block (lines 14-20) and keep only the `:root` CSS variable definitions (lines 7-12) so components can opt in via utility classes.

### MEDIUM

**6. Fix 404 page theming**

File: `src/pages/NotFound.tsx`, line 16. Replace `bg-gray-100` with `bg-background` and `text-gray-600` with `text-muted-foreground` so the 404 page respects dark mode.

**7. Move login route outside OnboardingGuard**

File: `src/App.tsx`. The `/login` route is currently a child of the `OnboardingGuard><Layout />` wrapper (line 105/352). The guard's `publicPaths` check short-circuits it, but the route still unnecessarily renders inside `<Layout>`. Move the login route (line 352) up next to the other auth routes at lines 100-102, outside the guarded block, alongside `/auth/pending-approval` and `/auth/account-rejected`. Same for other public routes at lines 353-358.

**8. Consolidate duplicate CSS rules**

File: `src/styles/ios-compatibility.css`. Multiple `body` blocks exist (lines 15, 89, 162, 239). Merge them into one. Also remove the duplicate `button:active { transform: scale(0.97) }` rule (appears at lines 190-195 and again at 316-319 in the iOS 26 section). The iOS 26 version with `:not(:disabled)` is better -- keep that one, remove the earlier duplicate.

### LOW

**9. Note `@ts-nocheck` in 36 files**

No action now. Noted for incremental cleanup. 36 files have `@ts-nocheck` including critical ones like `navigation.tsx`, `dialog.tsx`, and service files. These should be addressed file-by-file over time.

**10. Replace `confirm()` with toast for PWA updates**

File: `src/main.tsx`, lines 20-25. Replace the blocking `confirm()` dialog with a non-blocking `sonner` toast notification that includes a "Reload" action button. Import `toast` from `sonner`.

---

### Technical details

All CSS removals in `ios-compatibility.css` are safe deletions -- the removed rules either break functionality (translateY on focus), override design-system styling (valid/invalid borders), or duplicate what Tailwind utilities already provide. The touch-target sizing moves from global selectors to opt-in classes, so any component that currently benefits will need the class added (but the global version was causing more harm than good on small buttons).

The route restructuring in `App.tsx` moves 7 public routes (`login`, `auth/mfa`, `auth/verify`, `onboarding/profile`, `verification-pending`, `features-preview`, `install`) outside the `OnboardingGuard><Layout />` wrapper. The `NotFound` catch-all stays inside the guarded layout so 404s still get the app chrome for authenticated users.

