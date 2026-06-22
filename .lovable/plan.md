## Audit findings — Lighting + Spaces

I went through the lighting code end-to-end (DB schema, RLS, services, hooks, and the new RoomFixturesPanel/editor) and cross-referenced it against the rooms tables. Here is what I found and what I want to fix. Nothing else outside lighting is being touched.

### 1. RLS gap — Court Officers can't actually use the new fixtures panel
- `lighting_fixtures` write policy uses `is_privileged()`, which only includes `admin / system_admin / facilities_manager / cmc / court_liaison`.
- Migration 057 explicitly says Court Officers should manage lighting (walkthroughs + fixtures) via `is_building_staff()`.
- Result: a Court Officer opening the new editor and tapping **Add fixture** or changing a status will get a silent RLS rejection.
- **Fix:** new migration that replaces the `lighting_fixtures` write policy with `is_building_staff()` (admin, system_admin, facilities_manager, court_officer) plus keeps cmc/court_liaison via a second policy if still needed. Read policy unchanged.

### 2. Reporters still can't pick a specific fixture when reporting an issue
- We added A1/A2/A3 labels to fixtures, but `LightingIssueForm` never lets the reporter choose one. The whole point of labeling was to tie reports to a fixture.
- **Fix:** after a room is picked in the report form, show a fixture picker populated from `useSpaceFixtures(roomId, 'room')`:
  - Default option: "Not sure / whole room"
  - Then `A1`, `A2`, `A3`… with their current status next to them ("A2 · was out 3 days ago")
  - Selected value is sent as `fixture_id` (already supported in `submitLightingIssue`).
- Auto-bumps `times_scanned` so the repeat-offender badge is fed from real reports, not just walkthroughs.

### 3. Room lighting profile is missing the data we promised
- `room_lighting_profiles` has no `fixture_count` column (the plan said we'd add it). Rather than store-and-drift, derive it.
- **Fix:** create a SQL view `room_lighting_profile_summary` that joins `room_lighting_profiles` to a `COUNT(*)` over `lighting_fixtures` per `space_id`, plus counts by status (functional / out / maintenance_needed). Use it in `LightingRoomsTable` so admins finally see "Room 510 — 4 fixtures, 1 out" at a glance.

### 4. Editor fixture panel is too shallow
Currently each fixture only exposes status + delete. Real-life triage needs:
- `bulb_count` (a fluorescent fixture is often 2–4 tubes, not 1)
- `ballast_issue` and `requires_electrician` toggles (these already exist on the table and drive the repeat-offender heuristic, but the UI never sets them)
- `notes`
- **Fix:** expand each row into a collapsible "Details" with these three controls. Keep the row compact by default (label + status + repeat badge).

### 5. Issues queue doesn't show which fixture
`LightingIssuesQueue` only shows the room. When a report comes in tagged to A2, the FC can't see it.
- **Fix:** join `lighting_fixtures(name)` on `fixture_id` in `listLightingIssuesForStaff`, and render `"Room 510 · Fixture A2"` when present.

### 6. Small correctness fixes in the new panel
- `nextLabel` doesn't handle deletions cleanly (it does, actually — uses Set lookup — but I'll add a unit-safe sort so labels stay numeric, e.g. A10 doesn't sort between A1 and A2 visually). Already using `numeric: true` — keep as is, just confirmed.
- `handleStatusChange` always sends `ballast_issue: false` and `requires_electrician: false`, which silently *clears* those flags every time someone toggles status. Fix: only send fields the user actually changed (use the mutation with a true patch, not a reset).
- `handleDelete` uses `confirm()`; on iOS PWA this is jarring. Replace with the existing `AlertDialog` component used elsewhere in the project.

### Technical details

**Migration (1 file):**
```sql
-- replace privileged write policy with building-staff write policy
DROP POLICY lighting_fixtures_privileged_all ON public.lighting_fixtures;
CREATE POLICY lighting_fixtures_building_staff_write
  ON public.lighting_fixtures FOR ALL TO authenticated
  USING (is_building_staff()) WITH CHECK (is_building_staff());

-- summary view for admin table
CREATE OR REPLACE VIEW public.room_lighting_profile_summary
WITH (security_invoker=on) AS
SELECT
  r.id AS room_id,
  rlp.bulb_type, rlp.ceiling_access, rlp.led_converted, rlp.notes,
  COUNT(lf.id)                                          AS fixture_count,
  COUNT(lf.id) FILTER (WHERE lf.status='functional')    AS functional_count,
  COUNT(lf.id) FILTER (WHERE lf.status='non_functional') AS out_count,
  COUNT(lf.id) FILTER (WHERE lf.status='maintenance_needed') AS maintenance_count
FROM public.rooms r
LEFT JOIN public.room_lighting_profiles rlp ON rlp.room_id = r.id
LEFT JOIN public.lighting_fixtures lf ON lf.space_id = r.id AND lf.space_type='room'
GROUP BY r.id, rlp.bulb_type, rlp.ceiling_access, rlp.led_converted, rlp.notes;

GRANT SELECT ON public.room_lighting_profile_summary TO authenticated;
```

**Frontend (focused edits, no rewrites):**
- `src/features/lighting/components/LightingIssueForm.tsx` — add fixture picker block.
- `src/features/lighting/components/RoomFixturesPanel.tsx` — collapsible details (bulb count, ballast, notes), AlertDialog delete, surgical status patch.
- `src/features/lighting/components/LightingIssuesQueue.tsx` — show fixture label.
- `src/features/lighting/services/lightingIssueService.ts` — extend select to include `fixture:lighting_fixtures(name)`.
- `src/features/lighting/services/roomLightingProfileService.ts` + `LightingRoomsTable.tsx` — read the new view and show fixture counts.

### Out of scope (call out, not touching)
- Bulk fixture creation / import — not asked for.
- Walkthrough flow changes — the existing walkthrough UI is unaffected and still wired to `space_id` correctly.
- The 2 stale rows that have `room_id` set but no `space_id` (DB inspection confirmed only 2 of 155 fixtures). I can clean these up in the same migration if you want — say the word.

OK to proceed with all six fixes?
