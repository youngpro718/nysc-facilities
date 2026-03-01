

## Audit Results: Session Creation Failures

### Root Cause

The database logs show **repeated duplicate key violations** on the `court_sessions_court_room_id_session_date_period_key` unique constraint. Every recent create attempt fails with:

> `duplicate key value violates unique constraint "court_sessions_court_room_id_session_date_period_key"`

This means you're trying to create a session for a **room + date + period combination that already exists**. The constraint `UNIQUE (court_room_id, session_date, period)` prevents duplicates.

### Why It Feels Broken

The UI gives you a generic "Failed to create session" toast with no explanation of *why*. It doesn't tell you that a session already exists for that room, and doesn't prevent you from selecting rooms that already have sessions.

### Proposed Fixes

#### 1. Filter out rooms that already have sessions for this date/period
In `CreateSessionDialog.tsx`, the room query already fetches rooms but doesn't check for existing sessions. Add a query to fetch existing sessions for the selected date/period, then:
- Mark rooms that already have sessions with a "Session exists" badge
- Disable selecting those rooms, or show a warning

#### 2. Improve error messaging for duplicate constraint violations
In `useCourtSessions.ts` `useCreateCourtSession`, update the `onError` handler to detect the unique constraint error and show a specific message like "A session already exists for this room on this date/period."

#### 3. Add an "upsert or edit" option
When a duplicate is detected, offer to navigate to the existing session for editing instead of failing silently.

### Implementation Details

**File: `src/hooks/useCourtSessions.ts`** (lines 102-105)
- Parse the error message for `court_sessions_court_room_id_session_date_period_key` and show a descriptive toast: "A session already exists for this courtroom on this date and period. Please edit the existing session instead."

**File: `src/components/court-operations/CreateSessionDialog.tsx`**
- Add a query for existing sessions on the selected date/period/building
- Cross-reference with room list to mark already-occupied rooms
- Disable or visually flag those rooms in the dropdown

