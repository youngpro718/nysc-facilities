

## Plan: Fix Critical Bugs & UX Improvements in Court Operations

This is a large set of issues. I'll prioritize by impact: critical bugs first (data loss / blocking), then UX regressions, then enhancements.

---

### Phase 1: Critical Bug Fixes

#### 1. Fix "Start Report" for 111 Centre Street
**Root cause**: `useStartTodaysReport` fetches ALL court assignments without filtering by building. It then tries to insert them all with the selected `building_code`. For 111, this creates sessions pointing to 100 Centre Street court rooms but tagged as building `111`, or simply fails because the room-to-court-room mapping doesn't distinguish buildings.

**Fix** (`src/hooks/useStartTodaysReport.ts`):
- After fetching assignments and court rooms, join through `rooms → floors → buildings` to determine which building each court room belongs to
- Filter assignments to only those whose court room belongs to the selected building
- This requires an additional query to get court room building associations, or filtering via the existing `court_rooms → rooms → floors → buildings` join

#### 2. Fix "Failed to create session" false error
**Root cause**: The `handleSubmit` in `CreateSessionDialog.tsx` calls `createSession.mutateAsync()` inside a try/catch. If the mutation succeeds, `onSuccess` fires and shows a success toast. But if there's any issue in the post-insert `.select().single()` call (e.g., RLS or schema mismatch), the mutation throws, the catch block runs, and the `onError` handler shows "Failed" — even though the row was inserted.

**Fix** (`src/hooks/useCourtSessions.ts`):
- In `useCreateCourtSession`, make the `.select().single()` portion more resilient — if the insert succeeded but the select fails, still treat it as success
- Add `onSuccess` invalidation of `existing-sessions-for-create` query key so the occupied room list refreshes

**Fix** (`src/components/court-operations/CreateSessionDialog.tsx`):
- After successful save with "Save & Add Another", also reset `selectedRoomId` and `selectedAssignment` and refocus the room search — this addresses bug #8 ("Save & Add Another" doesn't clear)

#### 3. Fix Calendar date picker closing on month navigation
**Root cause**: The Calendar component inside Popover doesn't have `pointer-events-auto` on its className. When clicking the month navigation arrows, the click propagates and closes the Popover.

**Fix** (`src/components/court-operations/CreateSessionDialog.tsx`):
- Add `className="p-3 pointer-events-auto"` to both Calendar instances (status detail date picker at line ~664 and notes date picker at line ~918)

**Fix** (`src/components/ui/date-picker.tsx`):
- The `DatePicker` component already passes `pointer-events-auto` via the Calendar's className — verify this is correct. The issue may be in the Popover's `PopoverContent` not having proper event handling.

---

### Phase 2: UX Fixes

#### 4. Fix Tab navigation in sessions grid
**Root cause**: In `SessionsTable.tsx`, the `InlineCell` `handleKeyDown` for Tab calls `handleSave()` but doesn't prevent default or manage focus to the next cell in the same row. The browser's default Tab moves to the next DOM-focusable element, which could be in a different row.

**Fix** (`src/components/court-operations/SessionsTable.tsx`):
- In `handleKeyDown`, intercept `Tab` key, prevent default, find the next editable cell in the same row (or first cell of next row if at end), and trigger click on it
- Similar logic to the existing `Enter` handler but moving horizontally through cells

#### 5. Add missing court statuses
**File**: `src/constants/sessionStatuses.ts`
- Add: `JS` (Jury Selection), `JS_COMP` (JS Complete), `HRG_ARGS` (Hearing - Arguments), `SETT` (Settlement), `CONF` (Conference)
- These are real statuses from the PDF reports that clerks need

#### 6. Fix "Save & Add Another" to properly clear form
Already covered in fix #2 — reset room selection, all case fields, and refocus the room search input.

---

### Phase 3: Enhancements (future consideration)
These are noted but will not be implemented in this pass unless requested:
- Calendar Count structured field (requires DB migration)
- Out Dates field for judges (requires DB migration)
- Row-level "Copy from yesterday" button
- Free-text date input for Date Tran/Start field

---

### Files to modify:
1. `src/hooks/useStartTodaysReport.ts` — filter assignments by building
2. `src/hooks/useCourtSessions.ts` — resilient error handling, invalidate create-dialog query
3. `src/components/court-operations/CreateSessionDialog.tsx` — calendar pointer-events, form reset on Save & Add Another
4. `src/components/court-operations/SessionsTable.tsx` — Tab navigation fix
5. `src/constants/sessionStatuses.ts` — add missing statuses

