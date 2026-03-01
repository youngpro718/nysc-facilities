

## Plan: Smart Judge Addition — Auto-Create Assignment from Part or Room

### Problem
When adding a new judge, the form requires **both** a courtroom selection **and** a part number to create the court assignment. If either is missing, no assignment is created at all. The user expects:
1. Typing a part number alone should be enough — the system should create the assignment even without a courtroom selected (or auto-match a room if one is available)
2. Selecting a courtroom alone should also work — the system associates the judge with that room
3. After adding, the judge should appear everywhere in the system (term sheet, sessions grid, etc.)

### Current Behavior
In `addNewJudge()` (judgeManagement.ts line 77): the assignment is **only** created when `courtroomId && part` are **both** provided. If only a part is given, nothing happens — the judge is created in `personnel_profiles` but never appears in `court_assignments`.

### Fix

**File: `src/services/court/judgeManagement.ts` — `addNewJudge()`**
- If **both** courtroom and part are provided: current behavior (look up room_id, create assignment) — no change
- If **only part** is provided (no courtroom): create the assignment with `room_id = null`, `room_number = ''`, and the part + justice name. This puts the judge on the term sheet as "unassigned to a room" but still visible
- If **only courtroom** is provided (no part): create the assignment with the room info but `part = null`. The judge is associated with that courtroom

**File: `src/components/court/JudgeStatusManager.tsx` — `AddJudgeDialog`**
- When a courtroom is selected, auto-populate the room number in the preview
- When a part is entered, show a note like "Will create Part 62 assignment" so the user knows it will be created even without selecting a courtroom
- After successful add, also invalidate `court-sessions` and `court-operations` query keys so the sessions grid picks up the new assignment immediately

### Technical Detail
The `court_assignments` table has `room_id` (nullable) and `room_number` (NOT NULL, default `''`). So creating an assignment with just a part is valid — `room_id` can be null and `room_number` can be empty string. The system will show the judge in the term sheet and assignment table, and they can be assigned a room later.

### Files to modify
1. `src/services/court/judgeManagement.ts` — relax the `courtroomId && part` guard to `courtroomId || part`
2. `src/components/court/JudgeStatusManager.tsx` — improve preview text, add query invalidations

