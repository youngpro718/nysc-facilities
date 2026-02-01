
Goal: make the Standard User experience consistent and fast everywhere (“Report Issue” always opens the 2‑step Simple Report flow), always shows already-assigned rooms when they exist, and gracefully handles “no room assigned yet” with a clear “sign up/request assignment” prompt (without routing users to the public /forms pages that say “You’re already logged in”).

## 1) In-depth audit (what’s happening today)

### A. Entry points that a Standard user uses (and what they do right now)

1) **Standard Dashboard (/dashboard)**
- Uses `QuickIssueReportButton` → opens `ResponsiveDialog` → `SimpleReportWizard`.
- This is the correct direction, but users still report:
  - “It looks like the same steps”
  - “Doesn’t show already assigned rooms”

2) **My Issues (/my-issues)**
- Desktop: opens `SimpleReportWizard` in `ResponsiveDialog`.
- Mobile: **does NOT use SimpleReportWizard**; it uses `MobileRequestForm` (`type="issue_report"`) which is a **4-step UI** and (critically) does not actually insert into `issues` at all (it just calls `onSubmit(formData)`).
- Result: on mobile it still feels like the old multi-step flow, and can also silently fail to create a real issue.

3) **My Activity (/my-activity)**
- In the “Issues” tab, the “Report Issue” button navigates to **`/forms/issue-report`**.
- `/forms/issue-report` is a “public form page” and for logged-in users it shows **“You’re already logged in!”**
- Result: user perceives routing is broken / inconsistent.

4) **New Request Hub (/request)**
- The “Report Issue” card navigates to **`/forms/issue-report`** (same problem as above).
- The “Request Key” card navigates to **`/forms/key-request`** (same “You’re already logged in!” behavior).
- Result: “New Request pops up old page” and “already logged in” messages.

### B. Why “assigned rooms” aren’t reliably showing

There are multiple contributing issues:

1) **`SimpleReportWizard` primary-room auto-select logic is wrong for your real data**
- It currently does:
  - `assignedRooms.find(r => r.assignment_type === 'primary')`
- But in your database `occupant_room_assignments.assignment_type` is constrained to:
  - `primary_office`, `work_location`, `support_space`
- Also the table has a separate boolean `is_primary`.
- So the wizard’s “auto-select primary room” can fail and selection UX can feel broken.

2) **Occupant ID vs Auth User ID mismatch**
- `useOccupantAssignments` is called with `user.id`, and queries:
  - `.eq('occupant_id', occupantId)`
- But `occupant_room_assignments.occupant_id` references the `occupants` table (not `profiles`), and in your RLS you already have patterns that map “my occupant record” by **email**.
- For some users, their `occupants.id` may not equal `auth.uid()`. In that case:
  - they can have room assignments in the system, but the query using `occupant_id = auth.uid()` returns empty.
- That’s consistent with: “I have a room but it doesn’t show.”

3) **The “no room assigned” path isn’t implemented in the Simple wizard**
- `SimpleReportWizard` has a `useDifferentRoom` state but no UI to toggle it.
- If `assignedRooms` is empty, the current wizard effectively blocks progress (and doesn’t present the “sign up / request assignment” guidance you want).

### C. Why it still “looks like the old steps”
Even if Dashboard is using `SimpleReportWizard`, users are still frequently routed into older multi-step flows because:
- `MyActivity` and `RequestHub` still route into `/forms/*`
- `MyIssues` on mobile uses `MobileRequestForm` which is multi-step and not wired to insert issues

So the overall journey feels inconsistent even if one entry point was updated.

---

## 2) Implementation strategy (what we’ll change)

### Principle: one canonical “Standard user issue-report flow”
- Standard user should always get `SimpleReportWizard` (Drawer on mobile, Dialog on desktop).
- No authenticated UI route should navigate to `/forms/issue-report` anymore.
- `/forms/*` remains for anonymous / QR / public use only.

---

## 3) Concrete code changes (files + what will change)

### (1) Fix assigned-room fetching so it works for all users
**Target file:**
- `src/hooks/occupants/useOccupantAssignments.ts`

**Changes:**
- Add a “resolve occupant id” step inside the hook:
  1) Try to find an `occupants` row where `id = authUserId` (works for your current admin sample)
  2) If not found, fetch the user’s email (from `profiles` or from `useAuth()`’s `user.email`) and look up `occupants.id` by `occupants.email = myEmail`
  3) Use the resolved `occupantId` to query:
     - `occupant_room_assignments`
     - `key_assignments`
- Keep the return shape (`roomAssignments`, `keyAssignments`, `primaryRoom`, `storageAssignments`) so existing UI doesn’t break.

**Outcome:**
- Users with assignments linked to an `occupants` record by email will now see their assigned rooms.

### (2) Make `SimpleReportWizard` correctly recognize “primary” and handle “no rooms yet”
**Target file:**
- `src/components/issues/wizard/SimpleReportWizard.tsx`

**Changes:**
1) Fix primary-room auto-select:
   - Prefer `is_primary === true`
   - Fall back to `assignment_type === 'primary_office'`
   - Else pick first room

2) Ensure inserts are compatible with RLS and querying:
   - Insert both:
     - `created_by: user.id`
     - `reported_by: user.id`
   - (This prevents subtle policy mismatches and keeps future-proofing.)

3) Add an explicit “No assigned rooms” UX:
   - When `assignedRooms.length === 0`:
     - Show a clear card:
       - “No assigned room yet”
       - Explanation: “To show your room automatically, please request assignment.”
     - Provide actions:
       - Primary CTA: **“Request Room Assignment”**
         - This will route to an existing supported flow (`/request/help`) and prefill a “general” help request template (or create a staff_task directly—see note below).
       - Secondary CTA: **“Continue without a room”**
         - Allow user to proceed by asking for a short “Where is it?” field (one input), saved into `issues.location_description`, with `room_id = null`.
         - This maintains “fast reporting” even when assignments are missing.

4) Remove/replace the unused `useDifferentRoom` state:
   - Either implement it fully (manual room browsing) or remove it to reduce dead paths.
   - Given your “fast + assigned room” goal, we’ll bias toward:
     - “Request assignment” + “Continue without room” (no heavy manual browsing UI).

### (3) Eliminate the mobile-only old multi-step issue form
**Target file:**
- `src/pages/MyIssues.tsx`

**Changes:**
- Remove the `MobileRequestForm` path for `type="issue_report"`.
- Always use `ResponsiveDialog + SimpleReportWizard` for both mobile and desktop.
- Add optional deep-link support:
  - If URL has `?new=1`, auto-open the dialog.

**Outcome:**
- On mobile, “Report Issue” is 2 steps, not 4, and actually creates `issues` rows.

### (4) Fix “You’re already logged in!” routing from My Activity
**Target file:**
- `src/pages/MyActivity.tsx`

**Changes:**
- Replace all `navigate('/forms/issue-report')` uses with the in-app issue wizard flow.
Two options:
1) Open `SimpleReportWizard` directly from MyActivity using `ResponsiveDialog` + `useOccupantAssignments`
2) Or navigate to `/my-issues?new=1` (and MyIssues auto-opens wizard)

We will implement option (2) if you prefer minimal UI changes in MyActivity; option (1) if you want the absolute fastest “no navigation” experience.

Given your “fast and consistent” requirement, I recommend **option (1)** (open wizard in-place). It makes MyActivity feel seamless.

### (5) Fix “New Request → old page” from Request Hub
**Target file:**
- `src/pages/RequestHub.tsx`

**Changes:**
- Update the quick action routes:
  - Report Issue: from `'/forms/issue-report'` → `'/my-issues?new=1'` (or open modal in RequestHub)
  - Request Key: from `'/forms/key-request'` → `'/my-requests?new=1'` (and MyRequests auto-opens its “New Request” dialog)
- Keep supplies and help on `/request/supplies` and `/request/help` as-is (those are already correct).

### (6) Add “auto-open new request” support for key requests
**Target file:**
- `src/pages/MyRequests.tsx`

**Changes:**
- Read `?new=1` from URL and auto-open the new request form:
  - Desktop: `setShowRequestForm(true)`
  - Mobile: `setShowMobileForm(true)` (key request flow is currently implemented there)
- Optional: after opening, clean the query param (so refresh doesn’t keep reopening).

---

## 4) Acceptance criteria (what “done” looks like)

1) Standard user Dashboard → “Report Issue”:
- Shows 2-step wizard
- If user has room assignment, “Your Room” appears with their room(s)
- If user does not have a room assignment:
  - Sees “Request Room Assignment”
  - Can still submit issue with a simple “Where is it?” location input

2) My Issues page:
- Mobile and desktop both use the same 2-step Simple wizard
- Reporting creates a real row in `public.issues`

3) My Activity:
- “Report Issue” no longer routes to `/forms/issue-report`
- No “You’re already logged in!” message from authenticated flows

4) Request Hub:
- “Report Issue” and “Request Key” no longer route to `/forms/*`
- No “old page” / public form pages inside authenticated flows

---

## 5) Testing checklist (end-to-end)

Test in Preview with two test accounts:
- Account A: has an `occupants` record and at least one `occupant_room_assignments` row
- Account B: no assignments (and ideally no occupant record)

Scenarios:
1) /dashboard → Report Issue (desktop + mobile)
2) /my-issues → Report Issue (desktop + mobile)
3) /my-activity → Issues tab → Report Issue (desktop + mobile)
4) /request → Report Issue (desktop + mobile)
5) /request → Request Key → ensure it opens the correct in-app flow (not /forms/key-request)
6) Submit an issue in each entry point and confirm:
   - it appears under /my-issues
   - it appears under dashboard’s issues list (if applicable)

---

## 6) Notes / risks
- RLS: we will set both `created_by` and `reported_by` on insert to avoid policy drift.
- Occupant resolution by email relies on `profiles.email` being populated and matching `occupants.email`. If there are formatting mismatches (case/whitespace), we’ll normalize with lowercase/trim in queries.
- There are two different `useOccupantAssignments` hooks in the repo (one under `src/components/occupants/hooks/`). We will standardize usage for user-facing flows on the `src/hooks/occupants/useOccupantAssignments.ts` one to avoid confusion.

