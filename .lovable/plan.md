

# Complete Audit: UUID vs TEXT Type Mismatch

## Problem Identified

The Postgres error `column "related_id" is of type uuid but expression is of type text` is caused by the database trigger function `notify_admin_on_staff_task_request()` which was deployed in the recent migration.

### Root Cause

In the trigger function at line 138:
```sql
related_id: NEW.id::text
```

This casts the UUID `NEW.id` to TEXT, but the `admin_notifications.related_id` column is of type UUID. PostgreSQL cannot implicitly convert text back to UUID during INSERT.

---

## Audit Results

### Database Schema Analysis

| Table | Column | Type |
|-------|--------|------|
| `admin_notifications` | `related_id` | **UUID** |
| `user_notifications` | `related_id` | **UUID** |
| `staff_tasks` | `id` | **UUID** |

### Affected Database Functions

**1. `notify_admin_on_staff_task_request()` - BROKEN**
- Line 138: `NEW.id::text` - Incorrectly casts UUID to TEXT
- **Fix**: Remove `::text` cast, use `NEW.id` directly

**2. Other Functions (VERIFIED CORRECT)**
- `emit_admin_notification()` - Parameter is already UUID type
- `handle_issue_notifications()` - Uses `NEW.id` directly (correct)
- `notify_admin_on_issue_insert()` - Uses `NEW.id` directly (correct)
- `notify_admin_on_key_request_insert()` - Uses `NEW.id` directly (correct)
- `notify_admin_on_supply_request_insert()` - Uses `NEW.id` directly (correct)
- `notify_admins_of_key_request()` - Uses `NEW.id` directly (correct)
- `notify_court_assignment_changes()` - Uses `COALESCE(NEW.id, OLD.id)` (correct)
- `notify_role_change()` - Uses `NEW.user_id::uuid` (correct)
- `trg_emit_new_user_pending_admin_notification()` - Uses `NEW.id` directly (correct)
- `trg_emit_profile_approval_change()` - Uses `NEW.id::uuid` (correct)
- `auto_complete_room_request()` - Does NOT insert `related_id` (correct)

### Application Code Analysis

All TypeScript code uses string types for `related_id`, which is correct because:
- Supabase client converts UUIDs to strings in JavaScript
- The mismatch only occurs at the database trigger level

| File | Usage | Status |
|------|-------|--------|
| `src/hooks/useNotifications.ts` | `related_id?: string` | Correct |
| `src/hooks/useAdminNotifications.ts` | `related_id: string \| null` | Correct |
| `src/components/dashboard/NotificationCard.tsx` | `related_id?: string` | Correct |
| `src/pages/admin/KeyRequests.tsx` | Passes UUID string | Correct |
| `src/components/profile/reorganized/AdminManagementTab.tsx` | Uses RPC with UUID param | Correct |

---

## Fix Required

### Database Migration

Update the `notify_admin_on_staff_task_request()` function to remove the incorrect `::text` cast:

```sql
CREATE OR REPLACE FUNCTION public.notify_admin_on_staff_task_request()
RETURNS TRIGGER AS $$
DECLARE
  requester_name TEXT;
BEGIN
  IF NEW.is_request = true AND NEW.status = 'pending_approval' THEN
    SELECT COALESCE(full_name, email) INTO requester_name 
    FROM public.profiles WHERE id = NEW.requested_by;
    
    INSERT INTO public.admin_notifications (
      notification_type, 
      title, 
      message, 
      urgency, 
      metadata,
      related_table,
      related_id         -- Column is UUID type
    )
    VALUES (
      'new_issue',
      CASE 
        WHEN NEW.title = 'Room Assignment Request' 
        THEN 'Room Request: ' || COALESCE(requester_name, 'Unknown User')
        ELSE 'New Task Request: ' || COALESCE(requester_name, 'Unknown User')
      END,
      COALESCE(NEW.description, NEW.title),
      'medium',
      jsonb_build_object(
        'action_url', 
        CASE 
          WHEN NEW.title = 'Room Assignment Request' 
          THEN '/access-assignments?assign_user=' || NEW.requested_by
          ELSE '/tasks'
        END,
        'task_id', NEW.id,
        'requester_id', NEW.requested_by,
        'requester_name', requester_name
      ),
      'staff_tasks',
      NEW.id              -- FIXED: Removed ::text cast
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;
```

---

## Summary

| Component | Issue Found | Fix |
|-----------|-------------|-----|
| `notify_admin_on_staff_task_request()` trigger | `NEW.id::text` inserted into UUID column | Remove `::text` cast |
| All other DB functions | None | No changes needed |
| All TypeScript code | None | No changes needed |

### Impact

After the fix:
- Room assignment requests will successfully create admin notifications
- Deep linking from notifications to `/access-assignments?assign_user=X` will work
- The workflow implemented in the previous plan will function correctly

