# Access & Assignments FK Constraint Fix - COMPLETED

## Summary

The foreign key constraint issue on `occupant_room_assignments` has been fully resolved. The system now correctly uses:
- `profile_id` for registered users (from `profiles` table)
- `personnel_profile_id` for non-user staff (from `personnel_profiles` table)
- `occupant_id` for legacy occupants (backwards compatible)

## Changes Made

### Database
- Updated `personnel_access_view` to count room/key assignments using the correct columns
- Added performance indexes on `profile_id` and `personnel_profile_id` columns

### Code Updates

| File | Changes |
|------|---------|
| `useRoomAssignment.ts` | Accepts `source_type`, uses correct ID column based on person type |
| `useOccupantAssignments.ts` | Accepts `sourceType` parameter, queries correct column |
| `PersonnelQuickAssignDialog.tsx` | Passes `source_type` from person, uses correct column for all operations |
| `CreateAssignmentDialog.tsx` | Uses `personnel_access_view`, inserts with correct ID column |
| `AssignRoomBulkDialog.tsx` | Uses `personnel_access_view`, inserts with correct ID column |
| `useRoomAssignmentsList.ts` | Fetches and joins data from all three ID columns |
| `MyRoomCard.tsx` | Passes `'profile'` as source type for user room lookup |

## How It Works Now

1. **Assigning a Room**: When a user selects a person from the Access & Assignments page, the system checks `source_type`:
   - `'profile'` → inserts with `profile_id`
   - `'personnel_profile'` → inserts with `personnel_profile_id`
   - `'occupant'` → inserts with `occupant_id` (legacy)

2. **Querying Assignments**: All queries now check the correct column based on person type.

3. **View Counts**: The `personnel_access_view` now shows accurate room/key counts.
