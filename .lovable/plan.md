

# Fix: Judges Appearing in Multiple Rooms

## Problem
No unique constraint on `room_id` in `court_assignments` — every `upsert` silently inserts a new row instead of updating. Three rooms currently have duplicates (1047, 1602, 572), and the newer duplicate rows have wiped clerks/sergeant data.

## Fix (3 parts)

### 1. Database: Clean duplicates + add unique constraint
**Migration SQL:**
- Delete the 3 newer duplicate rows (IDs: `6a07e477`, `81dd65f5`, `0ee8a202`) — keep the originals that have clerk/sergeant data
- Add `UNIQUE` constraint on `room_id`
- This makes future `upsert` calls work correctly by matching on `room_id`

### 2. Code: Replace blind upserts with check-then-update
**`LiveCourtGrid.tsx`** — 3 locations:
- **Line 504 (assign)**: Check if row exists for `room_id` → if yes, `update` only justice/part; if no, `insert`
- **Line 523 (reassign)**: Same pattern
- **Line 184 (batch assign)**: Same pattern

This preserves existing clerks/sergeant when assigning a judge to a room.

### 3. Code: Fix insert in judgeManagement.ts
**`judgeManagement.ts` line 132**: Before inserting, check if a row already exists for that `room_id`. If so, update instead of insert.

## Files Modified
| File | Change |
|------|--------|
| Migration SQL | Delete 3 duplicate rows, add `UNIQUE(room_id)` |
| `src/components/court/LiveCourtGrid.tsx` | Replace 3 `upsert` calls with select→update/insert |
| `src/services/court/judgeManagement.ts` | Add existing-row check before insert |

