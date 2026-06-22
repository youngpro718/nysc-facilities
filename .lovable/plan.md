## What you reported

1. **Mobile quick-create errors on certain room types** (e.g. utility room) even though desktop works.
2. **Room number gets overwritten when you change the floor** during quick-create.
3. **Too many room types in the picker** — most aren't used in real life.
4. **Edit screen is overwhelming** — too many fields/options, especially on a phone.
5. **General room photo upload doesn't work** on non-courtroom rooms (photo never appears).
6. **Lighting management is too shallow** — no fixture count per room, no way to label/track individual fixtures, no history of repeat issues per fixture.

Below is a focused plan to address each one. The work is grouped so each piece is independently shippable.

---

## Part 1 — Quick-create on mobile (bugs)

**1a. Fix "utility room" / storage template error**
Quick-create sends `storageType: 'general'` for utility/filing rooms, but the discriminated schema also requires `status` to default and `storageCapacity` to be valid. The mutation likely fails on Zod validation for one of those fields when the template defaults are stale.

- Trace the exact error (capture toast + console) by reproducing in the sandbox.
- Make `storageType`, `storageCapacity`, and `storageNotes` always optional/nullable in `createSpaceSchema` for the `room` variant, and stop sending `as any` casts from `QuickSpaceTemplates`.
- Add a clearer error toast that shows the validation message (today it's swallowed by `getErrorMessage` returning generic text).

**1b. Stop room number from changing when floor changes**
Per existing memory rule (Room Number Input Integrity), manual entries must win. In `RoomPreviewCard.tsx` the smart-number regenerator currently resets `hasManuallyEditedNumber` whenever floor/building changes — that's why a typed number gets wiped.

- Only regenerate the number when (a) the user hasn't touched it AND (b) the current value is still the previously-suggested value. If the user typed anything custom, never overwrite — even across floor changes.
- When the user does change the floor and the number is still auto-generated, regenerate silently; otherwise leave the typed value alone and show a small "Suggest new number" link they can tap if they want.

---

## Part 2 — Trim the room-type list

Keep only the types staff actually use day-to-day. Proposed shortlist (everything else stays in the DB enum so historical rooms aren't broken, but is hidden from the picker):

Visible in the create/edit dropdown:
- Courtroom
- Judges' Chambers
- Jury Room
- Office (general)
- Conference Room
- Break Room
- Filing / Records Room (merged label)
- Utility / Storage Room (merged label)
- IT Room

Hidden by default (still selectable via an "Other / advanced" expandable section):
- Chamber, Robing Room, Male/Female Locker Room, Stake Holder, Administrative Office, Laboratory, Conference (legacy duplicate)

Implementation:
- Add a `VISIBLE_ROOM_TYPES` constant; `BasicRoomFields` and `QuickSpaceTemplates` filter against it.
- Edit screen shows the current type even if it's "hidden," so legacy rooms still display correctly.

I'll confirm the exact shortlist with you before shipping.

---

## Part 3 — Simplify the edit screen

The current edit uses a 7-step wizard (Core Identity → Capacity → Occupancy → Issues → Photos → Maintenance → Finishes). On mobile this is heavy.

Proposal:
- **Default view = "Essentials" only:** Room number, name, type, floor, phone, description, status. One screen, no wizard.
- **"More details" expandable section** below it for: capacity, occupancy, photos, maintenance, finishes. Each is a collapsible card so people only open what they need.
- Keep the wizard available on desktop for power users via an "Advanced editor" link, but it's no longer the default.
- For courtrooms, automatically expand Capacity (juror/spectator) and Photos since they matter there.

---

## Part 4 — Fix non-courtroom photo upload

`GeneralRoomPhotoUpload` gates the uploader on `roomId && isAuthenticated`. In the create flow there is no room ID yet, so the uploader never shows — that matches what you saw.

Fixes:
- During **create**, photos should be buffered locally and uploaded right after the room insert succeeds (same pattern courtroom photos use).
- During **edit**, verify the `room-photos` storage bucket exists (the `roomPhotos` constant points at it) and that RLS lets the user upload to `<roomId>/`. If the bucket is missing, create it via migration with proper policies.
- Add a visible upload progress + error toast so failures aren't silent.

You also asked whether to keep the feature for offices at all. I'd recommend keeping it but making it optional/collapsed — useful for documenting damage, layout, before/after photos.

---

## Part 5 — Lighting: fixture count + per-fixture tracking

Today `room_lighting_profiles` only stores bulb type and ceiling access. `lighting_fixtures` exists as a richer table but isn't wired into the per-room UI you've been using.

Proposed model:
- **Per-room summary:** add `fixture_count` (integer) to `room_lighting_profiles` so admins can record "this office has 4 fixtures" quickly.
- **Per-fixture detail (optional drill-down):** use the existing `lighting_fixtures` table. From the room's lighting panel, show a list like:
  - Fixture A1 — LED — OK
  - Fixture A2 — LED — Out (reported 3 times in 90 days)
  - Fixture A3 — Fluorescent — Ballast issue
- Each fixture row links to its issue history (already tracked in `lighting_issues`), with a "repeat offender" badge when ≥3 issues in the last 90 days.
- When a user reports a lighting issue, let them pick which fixture (A1, A2…) instead of just "the room." Default to "Not sure" so it stays one-tap fast.

UI flow:
1. Open a room's lighting card → see fixture count + a small grid of fixture chips.
2. Tap a chip → see that fixture's status, bulb type, and issue history.
3. "Report issue" prefilled with that fixture.

I'll confirm naming convention (A1/A2 vs. "Front-left / Back-right") with you before building.

---

## Technical notes

- New migration: add `fixture_count` to `room_lighting_profiles`; add `position_label` (text) to `lighting_fixtures` and a `room_id` index if missing. Include GRANTs for `authenticated` + `service_role` and RLS policies (read = authenticated, write = admin/facilities_manager).
- New migration: relax `createSpaceSchema` storage fields (frontend-only — no DB change needed; just code).
- Frontend: new `RoomTypePicker` shared component used by both quick-create and the edit form so the shortlist stays in one place.
- Frontend: refactor `EditSpaceDialog` to default to a single-screen "Essentials" form; existing `RoomEditWizard` becomes opt-in.
- Frontend: rework `GeneralRoomPhotoUpload` to support pre-save buffering.
- Frontend: new `RoomFixturesPanel` inside the lighting module, plus an "Assign fixture" select on the lighting issue report form.

---

## Suggested order

1. Bug fixes (Part 1) + photo upload fix (Part 4) — quick wins.
2. Trim room-type list (Part 2) — small, high-impact.
3. Edit screen simplification (Part 3).
4. Lighting fixture tracking (Part 5) — biggest piece, build last.

Want me to proceed with all five, or start with just the bug fixes + room-type trim first so you can sanity-check the direction?
