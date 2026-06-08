## Goal

Finish the seamless onboarding for court officers (apply the pending DB migration) and rework the Court Officer dashboard so it surfaces what an officer actually needs day-to-day.

## Part 1 — Apply onboarding migration (already drafted, awaiting approval)

Run the previously prepared migration:
- `trusted_email_domains` table (admin-managed, authenticated read) seeded with `nycourts.gov → court_officer`.
- `handle_trusted_signup(p_user_id)` security-definer function: on email verification, if the email's domain matches and the requested role matches `auto_role`, set `verification_status='verified'`, `is_approved=true`, insert into `user_roles`, and write an `admin_notifications` row (`auto_approved_signup`).
- `on_auth_user_email_confirmed` trigger on `auth.users` that fires when `email_confirmed_at` transitions from null.

Net effect: a `@nycourts.gov` signup who picks "Court Officer" lands on the dashboard the moment they click the verify link — no admin wait, admins still get notified.

## Part 2 — Court Officer dashboard upgrade

File: `src/features/court/pages/CourtOfficerDashboard.tsx`

Today it shows: 3 key stat cards, active key assignments, pending key requests alert, Quick Actions (Keys / Spaces / Term Sheet), and Term Sheet preview. That's a good base but it under-uses the officer's actual scope (Keys + Spaces + Term Sheet + reporting issues).

Add / change:

1. **Stat strip → 4 cards** (mobile: 2x2, desktop: 4 across)
   - Total Keys, Checked Out, Available *(kept)*
   - **Pending Key Requests** (new) — replaces the standalone alert below; tap → `/admin/key-requests`. Variant warning when > 0.

2. **My Reported Issues card** (new, left column under key assignments)
   - Pulls last 5 issues where `reported_by = user.id` and `status != 'resolved'`.
   - Shows title, room, status pill, age.
   - Header action "Report issue" → `/my-issues` (matches existing pattern).
   - Empty state: "No open issues you've reported."

3. **Today's Key Activity** (new, compact strip above active assignments)
   - Counts from `key_assignments` for today: checked out today, returned today.
   - Gives officers a quick "what changed on my shift" read.

4. **Recently Returned Keys** (new tab/section toggle on the Active Assignments card)
   - Same card gets a small `Active | Recent Returns` toggle. Recent = `returned_at` in last 24h, limit 5. Useful for verifying turn-ins.

5. **Quick Actions** — add a fourth action:
   - **Report an Issue** → `/my-issues` (officers are on the floor; quick-report is high-value).
   - Keep Keys, Building Layout, Term Sheet.

6. **Keep** the Term Sheet preview in the right column.

7. **Drop** the standalone Pending Key Requests alert card (folded into the stat strip).

### Technical notes
- All new queries use the existing `supabase` client and `QUERY_CONFIG.refetch.realtime`.
- Status pills use existing `text-foreground` + `hsl(var(--status-*))` tokens already in the file — no new color classes.
- Toggle uses local `useState<'active' | 'recent'>` — no new dependencies.
- Issues query selects: `id, title, status, created_at, rooms:room_id (room_number)` filtered by `reported_by = user.id`.
- Today's key activity uses two `count: 'exact', head: true` queries with `gte('assigned_at', startOfDay)` and `gte('returned_at', startOfDay)`.
- Layout stays `grid-cols-1 lg:grid-cols-5` (3 + 2); mobile order unchanged.

## Out of scope (will follow up if you want)

- Admin UI for managing `trusted_email_domains`.
- Lighting/maintenance widgets — court officers don't own those.
- Signup-to-first-action analytics.