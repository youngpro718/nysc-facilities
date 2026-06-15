## Goals

You're testing as a standard user and four things are off:
1. Requests you submit don't appear in **My Activity** on the dashboard (they do show on the `/my-activity` page).
2. The request task types are confusing/redundant — let's collapse them.
3. The Setup form asks for things you don't care about (Easel, Podium, headcount, occasion).
4. The Profile editor nags you to "finish your profile" and won't save Department; we also need to remove Bio + Username and add a Job Title dropdown.

---

## 1. Dashboard "My Activity" — show task requests

**Problem.** The dashboard widget (`CompactActivitySection`) only renders `supplyRequests` and `issues`. Task requests you make through "Make a Request" live in `staff_tasks` and are never passed in, so they only show on the full `/my-activity` page.

**Fix.** Pass the user's staff_tasks (where `requested_by = me`) into the widget and render them inside the existing **Requests** tab alongside issues, sorted by `created_at` desc. Tab count includes open task requests. Same card style as issues; status pills use the existing task status labels (Pending Approval, Approved, Claimed, In Progress, Completed).

---

## 2. Consolidate request task types

Today there are six types: Move Item, Delivery, Setup, Pickup, Maintenance, General. My recommendation, given your feedback:

**Keep four, drop two:**

| Type | What it covers | Fields |
|---|---|---|
| **Move** | Furniture, files/boxes, anything from one room to another | Item category dropdown (Desk, Chair, Locker, Filing Cabinet, Boxes/Files, Other → text), From room, To room, Quantity, Notes |
| **Delivery** | Drop something off at a room | What's being delivered (text), To room, Notes |
| **Pickup** | Collect something from a room | What to pick up (text), From room, Notes |
| **Setup** | Arrange a room for a meeting/event | Room, Date, Time, Furniture quantities (Tables/Chairs/Desks only — see §3), Arrangement notes |

**Drop:**
- **General Task** — too vague; everything fits one of the four above.
- **Maintenance** — already covered by the Issues flow (`/issues`). Reporting a broken thing belongs there, not in task requests.

DB enum stays (`task_type`) so existing records keep working; we just hide General/Maintenance from the request dialog. Admin-created tasks in `CreateTaskDialog` can keep all six for flexibility.

---

## 3. Simplify the Setup form

In `SetupRequestForm.tsx`:
- **Remove** Podium and Easel from the furniture list (keep Tables, Chairs, Desks).
- **Remove** the attendee/head count field entirely.
- **Remove** the "What's the occasion?" / setup type dropdown (Meeting/Hearing/Training/Event/Other).
- **Keep** room, date, time, furniture quantities, and "How should the room be arranged?" notes.

---

## 4. Profile editor — fix save + trim fields

**Why save fails.** The "Finish your profile" banner checks specific profile columns (likely `department` + something else). Two things to verify and fix:
- The save mutation in `useProfileForm` runs an `UPDATE` against `profiles` — confirm the row actually updates (RLS self-update policy is in place per memory) and that the banner's completeness check reads the same column we're writing. If the banner is looking at `title` and we never wrote it, that explains the persistent nag.
- Add proper toast on success/failure and surface the real Postgres error if `UPDATE` returns zero rows.

**Form changes in `BasicInfoFields.tsx`:**
- **Remove** Bio textarea.
- **Remove** Username field (display name = first + last).
- **Replace** the free-text Job Title input with a **dropdown** of fixed titles. Starter list — confirm and I'll wire it in:
  - Court Officer
  - Court Analyst
  - Court Clerk
  - Sergeant
  - Lieutenant
  - Captain
  - Major
  - Management / Supervisor
  - Other (free-text fallback)
- **Keep** First Name, Last Name, Department, Phone, Emergency Contact.

Update `personalInfoSchema` to drop `username`/`bio` requirements and to validate `title` against the enum list. Update the "finish your profile" banner check to require: first_name, last_name, department, title.

---

## Open question before I build

I need your final job-title list. The starter above is a guess — reply with the exact titles you want in the dropdown (and whether "Other" should remain a free-text escape hatch).

## Technical notes

- Files touched: `RequestTaskDialog.tsx`, `staffTasks.ts` (label map only, enum unchanged), `SetupRequestForm.tsx`, `BasicInfoFields.tsx`, `profileSchema.ts`, `useProfileForm.ts`, `CompactActivitySection.tsx` + its parent that fetches data (likely `UserDashboard.tsx` — needs a `staff_tasks` query filtered by `requested_by = user.id`), and wherever the "finish your profile" banner lives (to align its completeness check with the new field set).
- No DB migrations required. Task type enum and profile columns stay as-is; we're only changing what the UI shows and validates.
