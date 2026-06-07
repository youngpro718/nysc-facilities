# Full App Audit — Prioritized Backlog

## Goal
One ranked backlog. No long prose report. Every finding has: severity, axis, evidence (file/route/table), effort, recommendation. Brutal tone — calls out generic/confused/weak choices, not just bugs.

## How I'll run it (parallel investigation, then synthesis)

I'll spawn 4 read-only sub-investigators in parallel, each owning one axis. They return raw findings; I de-dupe, rank, and produce the backlog.

### 1. Security & data access
- Re-run `security--run_security_scan` + `supabase--linter` for a fresh baseline.
- For every table in `public`: confirm RLS enabled, GRANTs sane, no `profiles.role`/`profiles.department` used in policies, no `USING (true)` on sensitive tables.
- Audit every edge function: JWT verification, service-role key usage, input validation, path traversal, CORS.
- Storage buckets: which are public, which leak PII (personnel photos, key photos, issue attachments, room photos).
- Secrets: scan repo for hardcoded keys, check anon key is the only client-side key.
- Auth: session refresh redirect guard, password reset route, role escalation paths, `user_roles` write policies.
- Audit-log integrity: who can insert/update/delete `audit_logs`, `security_audit_log`, `role_audit_log`.

### 2. Functional / wiring
- Walk every route in the router: dead routes, role-gated routes that misroute, 404s.
- Sidebar/nav: every link resolves, every role sees the correct subset (admin, court_liaison, court_officer, court_aide, standard, purchasing, facilities_manager, system_admin).
- React Query: mutations that don't invalidate, stale lists after create/update/delete, missing optimistic rollback.
- Realtime subscriptions: leaks, missing cleanup, channels that never fire.
- Forms: Zod coverage, Radix Select null handling, disabled-state during submit, error toasts.
- Cross-module dependencies: term sheet ↔ court_assignments, keys ↔ key_requests, issues ↔ rooms, inventory low-stock thresholds.
- Dead code: unused hooks, orphan components, removed CMC scheduling residue.

### 3. Product identity & UX critique (the brutal part)
- Brand: does "NYSC Facilities Hub" actually have an identity, or is it shadcn-default? Voice, naming, iconography, empty states.
- IA: 8 roles × N modules — is the mental model coherent or a pile of features? "Building Issues" vs "Operations" vs "Maintenance" vs "Lighting Issues" — overlapping concepts.
- Dashboards: per role, what's the first screen actually telling them? Is it useful or vanity stats?
- Naming consistency: Spaces vs Rooms vs Floors vs Unified Spaces; Term Sheet vs Courtroom Directory; Personnel vs Occupants vs Staff vs Profiles.
- Feature bloat: 130+ tables. Which features are zombies (no traffic, no clear owner)?
- Mobile-first claim vs reality on /term-sheet, /spaces, /issues, /keys.

### 4. Visual design & polish
- Typography: still defaulting to Inter-ish stack? Heading hierarchy actually used?
- Color: semantic tokens vs raw classes audit (`text-white`, `bg-black`, hardcoded hex).
- Contrast (WCAG AA) on status pills, priority dots, muted text.
- Density: card padding, table row height, mobile tap targets ≥44px.
- Motion: gratuitous vs purposeful, reduced-motion respect.
- Empty/loading/error states: skeletons present? Empty states have CTA?
- iOS: `h-dvh`, safe-area, sticky headers under notch.

## Deliverable format

Single Markdown file at `/mnt/documents/audit-backlog.md` (and rendered as a `presentation-artifact`):

```text
| # | Sev | Axis | Title | Evidence | Effort | Recommendation |
```

- Severity: P0 (security/data loss), P1 (broken or unsafe), P2 (confused/inconsistent), P3 (polish).
- Axes: SEC, FN, UX, UI.
- Sorted P0 → P3, then by axis.
- Followed by a short "Identity Critique" section (≤30 lines) — the unfiltered take on what the app *is* vs what it's trying to be, and 3 concrete repositioning moves.

## Out of scope
- No code changes in this pass. You triage the backlog, then we attack items in follow-up builds.
- No penetration testing beyond what the Supabase scanner + manual policy review can catch.
- No performance profiling unless I trip over something egregious.

## Expected runtime
~5–10 minutes of parallel investigation, then the backlog file.
