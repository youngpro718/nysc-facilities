
# Complete Audit: Access & Assignments Foreign Key Constraint Issue

## Problem Identified

When trying to assign a room to a person from the Access & Assignments page, the operation fails with:

```
insert or update on table "occupant_room_assignments" violates foreign key constraint "fk_occupant"
Details: Key is not present in table "occupants"
```

---

## Root Cause Analysis

### Database Architecture (Current State)

The `occupant_room_assignments` table has THREE assignee columns:

| Column | References | Status |
|--------|-----------|--------|
| `occupant_id` | `occupants` table | Legacy - has FK constraints |
| `profile_id` | `profiles` table | New - has FK constraint |
| `personnel_profile_id` | `personnel_profiles` table | New - has FK constraint |

A CHECK constraint ensures at least one is populated:
```sql
CHECK ((occupant_id IS NOT NULL) OR (profile_id IS NOT NULL) OR (personnel_profile_id IS NOT NULL))
```

### The Conflict

1. **The View (`personnel_access_view`)** shows people from:
   - `profiles` (registered users) 
   - `personnel_profiles` (non-user personnel)
   
2. **The Code** uses `person.id` and inserts into `occupant_id`:
   ```typescript
   // PersonnelQuickAssignDialog.tsx
   await handleAssignRoom(selectedRoomId, [person.id], 'primary_office', isPrimary);
   
   // useRoomAssignment.ts
   const assignments = selectedOccupants.map((occupantId) => ({
     occupant_id: occupantId,  // <-- WRONG: This is a profile_id, not occupant_id!
     room_id: selectedRoom,
     ...
   }));
   ```

3. **The FK constraint fails** because the profile ID `9a0efdc3-bf45-4228-9a65-2a5c5e570367` exists in `profiles` table but NOT in `occupants` table.

### Data Analysis

```text
Current occupant_room_assignments data:
- Total: 8 records
- With occupant_id: 8
- With profile_id: 0  
- With personnel_profile_id: 0

The profile_id/personnel_profile_id columns exist but are NOT being used!
```

---

## Files Affected

### Must Update (Room Assignments)

| File | Issue | Fix Required |
|------|-------|--------------|
| `useRoomAssignment.ts` | Uses `occupant_id` for all | Use `profile_id` or `personnel_profile_id` based on source |
| `PersonnelQuickAssignDialog.tsx` | Queries by `occupant_id` | Use correct column based on `source_type` |
| `useOccupantAssignments.ts` | Queries by `occupant_id` only | Query by `profile_id` OR `personnel_profile_id` |
| `CreateAssignmentDialog.tsx` | Selects from `occupants` table | Should select from `personnel_access_view` |
| `AssignRoomBulkDialog.tsx` | Selects from `occupants` table | Should select from `personnel_access_view` |
| `useRoomAssignmentsList.ts` | Joins on `occupant_id` | Should join on all three columns |
| `occupantService.ts` | Uses `occupant_id` | Needs update if used with profiles |

### Must Update (Key Assignments)

| File | Issue |
|------|-------|
| `key_assignments` table | Same architecture - has `occupant_id`, `profile_id`, `personnel_profile_id` |
| Key assignment hooks | Likely same issue |

### Must Update (Database View)

| View | Issue |
|------|-------|
| `personnel_access_view` | Counts using `occupant_id` instead of correct columns |

---

## Technical Solution

### 1. Update Room Assignment Hook

```typescript
// useRoomAssignment.ts - Must accept source_type and use correct column

interface AssignmentPayload {
  room_id: string;
  assignment_type: string;
  assigned_at: string;
  is_primary: boolean;
  occupant_id?: string;      // For legacy occupants
  profile_id?: string;        // For registered users
  personnel_profile_id?: string;  // For personnel
}

const handleAssignRoom = async (
  selectedRoom: string,
  selectedPersons: Array<{ id: string; source_type: 'profile' | 'personnel_profile' | 'occupant' }>,
  assignmentType: string,
  isPrimaryAssignment: boolean
) => {
  const assignments = selectedPersons.map((person) => {
    const base = {
      room_id: selectedRoom,
      assignment_type: assignmentType,
      assigned_at: new Date().toISOString(),
      is_primary: isPrimaryAssignment
    };
    
    switch (person.source_type) {
      case 'profile':
        return { ...base, profile_id: person.id };
      case 'personnel_profile':
        return { ...base, personnel_profile_id: person.id };
      default:
        return { ...base, occupant_id: person.id };
    }
  });
  
  // Insert...
};
```

### 2. Update PersonnelQuickAssignDialog

Pass `source_type` from the `PersonnelAccessRecord`:

```typescript
await handleAssignRoom(
  selectedRoomId,
  [{ id: person.id, source_type: person.source_type }],  // Include source_type
  'primary_office',
  isPrimary
);
```

### 3. Update useOccupantAssignments Hook

Query based on person type:

```typescript
const fetchAssignments = async (personId: string, sourceType: 'profile' | 'personnel_profile') => {
  const column = sourceType === 'profile' ? 'profile_id' : 'personnel_profile_id';
  
  const { data } = await supabase
    .from("occupant_room_assignments")
    .select("...")
    .eq(column, personId);
};
```

### 4. Update Database View

```sql
-- personnel_access_view should count using correct columns
CREATE OR REPLACE VIEW personnel_access_view AS
WITH profile_counts AS (
  SELECT p.id,
    (SELECT count(*) FROM occupant_room_assignments ora 
     WHERE ora.profile_id = p.id) AS room_count,
    (SELECT count(*) FROM key_assignments ka 
     WHERE ka.profile_id = p.id AND ka.returned_at IS NULL) AS key_count
  FROM profiles p
),
personnel_counts AS (
  SELECT pp.id,
    (SELECT count(*) FROM occupant_room_assignments ora 
     WHERE ora.personnel_profile_id = pp.id) AS room_count,
    (SELECT count(*) FROM key_assignments ka 
     WHERE ka.personnel_profile_id = pp.id AND ka.returned_at IS NULL) AS key_count
  FROM personnel_profiles pp
)
...
```

---

## Implementation Steps

### Database Changes

1. Update `personnel_access_view` to count by `profile_id` and `personnel_profile_id`
2. Consider adding indexes on `profile_id` and `personnel_profile_id` columns
3. Optional: Remove redundant FK constraints on `occupant_id` (there are 4 duplicates)

### Code Changes

1. **`useRoomAssignment.ts`** - Accept source_type, use correct column
2. **`PersonnelQuickAssignDialog.tsx`** - Pass source_type, update all queries
3. **`useOccupantAssignments.ts`** - Accept sourceType parameter
4. **`CreateAssignmentDialog.tsx`** - Use `personnel_access_view` instead of `occupants`
5. **`AssignRoomBulkDialog.tsx`** - Use `personnel_access_view` instead of `occupants`  
6. **`useRoomAssignmentsList.ts`** - Join on all three ID columns
7. **`occupantService.ts`** - May need conditional logic

---

## Summary

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| FK violation | Code uses `occupant_id` for profile IDs | Use `profile_id` or `personnel_profile_id` based on source |
| View counts wrong | View queries by `occupant_id` | Update to query by correct columns |
| Assignment dialog broken | Selects from `occupants` table | Select from `personnel_access_view` |
| Assignment queries fail | Only queries `occupant_id` | Query all three columns with OR |

### Expected Results After Fix

- Room assignments work for registered users (profiles)
- Room assignments work for court personnel (personnel_profiles)
- View shows correct counts for each person
- Legacy occupant assignments continue to work
