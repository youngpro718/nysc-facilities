
# Fix Room Assignments Display Issue

## Problem Summary

Room assignments are successfully saved to the database (using `profile_id`), but the "Report an Issue" wizard and other features still show "No assigned room yet" because they use an outdated hook that queries by `occupant_id`.

## Root Cause

There are **two different hooks** with the same name in different locations:

| Hook Location | Used By | Current Behavior |
|---------------|---------|------------------|
| `src/hooks/occupants/useOccupantAssignments.ts` | SimpleReportWizard, QuickIssueReportButton, MyIssues, MyActivity, SetupRequestForm | Looks up assignments by `occupant_id` (returns empty for profile users) |
| `src/components/occupants/hooks/useOccupantAssignments.ts` | MyRoomSection, MyRoomCard | Updated to use `profile_id` (works correctly) |

The first hook has complex legacy logic that:
1. Tries to find an occupant by direct ID match in `occupants` table
2. Falls back to email-based lookup
3. Then queries `occupant_room_assignments.occupant_id`

Since regular users don't exist in the legacy `occupants` table, and assignments now use `profile_id`, this returns nothing.

## Solution

Update `src/hooks/occupants/useOccupantAssignments.ts` to:
1. Query `occupant_room_assignments` by `profile_id` for authenticated users (primary)
2. Keep fallback to legacy `occupant_id` lookup for backward compatibility
3. Query `key_assignments` by `profile_id` as well

## Files to Update

| File | Change |
|------|--------|
| `src/hooks/occupants/useOccupantAssignments.ts` | Rewrite to query by `profile_id` first, then fallback to legacy occupant lookup |

## Technical Implementation

```typescript
// Updated logic for useOccupantAssignments
export const useOccupantAssignments = (authUserId: string) => {
  return useQuery<OccupantAssignments>({
    queryKey: ['occupantAssignments', authUserId],
    queryFn: async () => {
      if (!authUserId) throw new Error('No user ID provided');

      // STRATEGY: Query directly by profile_id first (new assignments)
      // Then fallback to legacy occupant_id lookup for backward compatibility
      
      // 1. Try profile_id first (for users with auth accounts)
      const { data: profileRoomAssignments, error: profileRoomError } = await supabase
        .from('occupant_room_assignments')
        .select(`...full query...`)
        .eq('profile_id', authUserId);

      // 2. Try profile_id for key assignments  
      const { data: profileKeyAssignments } = await supabase
        .from('key_assignments')
        .select(`...`)
        .eq('profile_id', authUserId)
        .is('returned_at', null);

      // 3. If profile_id query found results, use those
      if (profileRoomAssignments?.length > 0 || profileKeyAssignments?.length > 0) {
        return formatAssignments(profileRoomAssignments, profileKeyAssignments);
      }

      // 4. Fallback: Legacy occupant_id lookup for backward compatibility
      const occupantId = await resolveOccupantId(authUserId);
      if (occupantId) {
        // Query by occupant_id...
      }

      return emptyResult;
    }
  });
};
```

## Expected Results After Fix

- Settings page "My Room" section shows assigned room (already works via updated hook)
- "Report an Issue" wizard shows assigned rooms for selection
- MyIssues and MyActivity pages can access room data
- QuickIssueReportButton shows room options
- SetupRequestForm can pre-select user's rooms

## Components That Will Start Working

1. **SimpleReportWizard** - Will show room selection instead of "No assigned room yet"
2. **QuickIssueReportButton** - Will pass correct room data to wizard
3. **MyIssues page** - Room context will be available
4. **MyActivity page** - Room assignments accessible
5. **SetupRequestForm** - Room dropdown will populate
