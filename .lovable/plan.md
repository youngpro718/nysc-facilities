
# Fix Foreign Key Constraint Error on User Notifications

## Problem Identified

When submitting a "Set up a room" request (or any staff task), the database throws:
```
insert or update on table "user_notifications" violates foreign key constraint "user_notifications_user_id_fkey"
```

### Root Cause

The `user_notifications.user_id` column has a **foreign key pointing to the wrong table**:

| Current Setup | Correct Setup |
|--------------|---------------|
| `user_notifications.user_id` → `occupants.id` | `user_notifications.user_id` → `profiles.id` |

This causes failures because:
1. The notification trigger queries `user_roles.user_id` (which stores `auth.users.id` / `profiles.id`)
2. It tries to insert notifications for admins
3. **3 out of 5 admins don't have `occupants` records** (they only have `profiles` records)
4. The insert fails the foreign key check

### Data Verification
- **Profiles table:** 10 authenticated users
- **Occupants table:** 101 records (mostly building personnel, not authenticated users)
- **Admins with occupant records:** 2 out of 5
- **Admins missing from occupants:** 3 (these cause the FK error)

## Solution

Change the foreign key to reference `profiles.id` instead of `occupants.id`. This makes sense because:
- Only authenticated users (in `profiles`) should receive notifications
- `profiles.id` = `auth.users.id` = `user_roles.user_id`
- All 10 authenticated users have `profiles` records

## Database Migration

```sql
-- Drop the incorrect foreign key
ALTER TABLE user_notifications 
DROP CONSTRAINT user_notifications_user_id_fkey;

-- Add the correct foreign key referencing profiles
ALTER TABLE user_notifications 
ADD CONSTRAINT user_notifications_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
```

## Files Modified

None - this is a database-only fix.

## Expected Outcome

After running the migration:
1. Task submissions will succeed without FK errors
2. All admins will receive notifications (not just the 2 with occupant records)
3. The notification system will work correctly for all authenticated users
