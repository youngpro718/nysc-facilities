
# Fix Foreign Key Constraint Violations for Issue Creation

## Problem Summary

When creating issues, users encounter:
> `insert or update on table "issues" violates foreign key constraint "issues_room_id_fkey"`

This happens because:
1. The `issues.room_id` column references `unified_spaces.id` (not `rooms.id`)
2. **19 rooms** exist in the `rooms` table but are missing from `unified_spaces`
3. Several components query the `rooms` table directly and use those IDs when creating issues

### Current State

| Table | Count |
|-------|-------|
| `rooms` | 113 |
| `unified_spaces` (rooms) | 94 |
| **Missing** | **19** |

---

## Solution: Two-Part Fix

### Part 1: Sync Missing Rooms to `unified_spaces`

Insert the 19 missing rooms into `unified_spaces` so all existing room IDs are valid foreign key references.

**SQL Migration:**
```sql
INSERT INTO unified_spaces (id, name, space_type, floor_id, room_number, room_type, status)
SELECT 
  r.id,
  COALESCE(r.name, r.room_number, 'Room'),
  'room',
  r.floor_id,
  r.room_number,
  r.room_type,
  'active'::status_enum
FROM rooms r
WHERE r.id NOT IN (SELECT id FROM unified_spaces WHERE id IS NOT NULL);
```

### Part 2: Add Trigger for Future Sync

Create a trigger so new rooms are automatically added to `unified_spaces`:

```sql
CREATE OR REPLACE FUNCTION sync_room_to_unified_spaces()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO unified_spaces (id, name, space_type, floor_id, room_number, room_type, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.name, NEW.room_number, 'Room'),
    'room',
    NEW.floor_id,
    NEW.room_number,
    NEW.room_type,
    'active'
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    room_number = EXCLUDED.room_number,
    floor_id = EXCLUDED.floor_id,
    room_type = EXCLUDED.room_type;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER rooms_sync_to_unified
  AFTER INSERT OR UPDATE ON rooms
  FOR EACH ROW
  EXECUTE FUNCTION sync_room_to_unified_spaces();
```

### Part 3: Update Components (Optional but Recommended)

While syncing fixes the immediate issue, it's cleaner to query `unified_spaces` directly in these components:

| Component | Current Query | Change |
|-----------|---------------|--------|
| `ReportIssueDialog.tsx` | Queries `rooms` table | Query `unified_spaces` with `space_type = 'room'` |
| `AdminQuickReportDialog.tsx` | Queries `rooms` table | Query `unified_spaces` with `space_type = 'room'` |
| `SimpleReportWizard.tsx` | Uses room_id from assignments | No change needed (assignments already use valid IDs) |
| `QuickIssueDialog.tsx` | Receives roomId as prop | Ensure caller passes `unified_spaces.id` |

---

## Implementation Plan

### Step 1: Database Migration
- Run SQL to insert 19 missing rooms into `unified_spaces`
- Create trigger for automatic future sync

### Step 2: Update `ReportIssueDialog.tsx`
Change the room query from:
```typescript
supabase.from("rooms").select(...)
```
To:
```typescript
supabase.from("unified_spaces")
  .select("id, name, room_number, floor_id, floors(building_id)")
  .eq('space_type', 'room')
  .order("room_number");
```

### Step 3: Update `AdminQuickReportDialog.tsx`
Same change - query `unified_spaces` instead of `rooms`.

### Step 4: Verify Occupant Assignment Sources
The `SimpleReportWizard` receives room assignments from:
- `useOccupantAssignments` hook
- `useUserRoomAssignments` hook

These query `occupant_room_assignments.room_id` which references `rooms.id`. After syncing, these IDs will exist in `unified_spaces` and work correctly.

---

## Files to Modify

| File | Changes |
|------|---------|
| *Database migration* | Insert 19 missing rooms + create sync trigger |
| `src/components/maintenance/ReportIssueDialog.tsx` | Query `unified_spaces` instead of `rooms` |
| `src/components/issues/admin/AdminQuickReportDialog.tsx` | Query `unified_spaces` instead of `rooms` |

---

## Expected Outcome

After implementation:
- All 113 rooms will exist in `unified_spaces`
- Issue creation will succeed for any room
- New rooms automatically sync to `unified_spaces`
- Components use consistent data source
