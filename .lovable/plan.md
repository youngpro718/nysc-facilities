
# Fix Room Assignment Workflow - Complete Rework

## Problem Summary

The current room assignment request workflow is broken because:

1. **Disconnected systems**: User requests create "tasks" that go to `/tasks`, but admin needs to actually assign rooms from `/access-assignments`
2. **Approval doesn't assign**: When admin approves a task, nothing happens - the room isn't assigned
3. **Confusing notifications**: Notifications direct to Tasks page, but the real action (assigning a room) happens elsewhere
4. **No task closure**: Even after admin assigns a room via the Quick Assign dialog, the original task stays open

## Solution: Simplified Room Assignment Flow

Rather than routing through the generic "Tasks" system, create a dedicated room assignment request flow that is self-contained.

---

## Part 1: Dedicated Room Assignment Notification

### Changes to Notification System

**Update NotificationBox to handle room assignment requests**

When a notification of type `staff_task_pending` with title "Room Assignment Request" is clicked, it should:
- Navigate to `/access-assignments` (not `/tasks`)
- Include the requester's user ID in the URL so admin can quickly find and assign them

**Modify the notification trigger** to include better metadata:
```sql
-- Store requester_id in metadata for quick navigation
action_url = '/access-assignments?assign_user=' || NEW.requested_by
```

---

## Part 2: Quick Assign from Notification

### Add Auto-Open Dialog on Access Assignments Page

**Update AccessAssignments.tsx**:
- Read `assign_user` query parameter on mount
- If present, find the person in the personnel list and auto-open the `PersonnelQuickAssignDialog`
- Admin can immediately assign the room without searching

### Flow After Implementation
```
User clicks "Request Room Assignment"
    ↓
Creates staff_task (pending_approval) + notification to admin
    ↓
Admin sees notification: "New Room Assignment Request from Jane Smith"
    ↓
Admin clicks notification → Goes to /access-assignments?assign_user=<jane-id>
    ↓
PersonnelQuickAssignDialog auto-opens for Jane
    ↓
Admin selects room → Clicks "Add Room"
    ↓
Room assignment created AND task auto-completed
```

---

## Part 3: Auto-Complete Task When Room Assigned

### Link Room Assignment to Task Completion

**Create database trigger or application logic**:

When an `occupant_room_assignment` is inserted for a user who has a pending "Room Assignment Request" task, automatically:
1. Mark that task as `completed`
2. Add completion notes: "Room assigned: Room {room_number}"
3. Notify the user that their request was fulfilled

**Option A: Database Trigger** (cleaner)
```sql
CREATE FUNCTION auto_complete_room_request()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE staff_tasks
  SET status = 'completed',
      completed_at = NOW(),
      completion_notes = 'Room assigned: ' || (SELECT room_number FROM rooms WHERE id = NEW.room_id)
  WHERE requested_by = NEW.occupant_id
    AND title = 'Room Assignment Request'
    AND status IN ('pending_approval', 'approved');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_room_assignment_complete_task
AFTER INSERT ON occupant_room_assignments
FOR EACH ROW EXECUTE FUNCTION auto_complete_room_request();
```

**Option B: Application Logic** (in useRoomAssignment hook)
- After successful room assignment, check for pending room request tasks for that user
- Mark them as completed

---

## Part 4: Update Notification Trigger

### Modify `notify_admin_on_staff_task_request` Trigger

Current trigger sends notifications to `user_notifications` table, but admin uses `admin_notifications` table. Need to fix this.

**Changes**:
1. Insert into `admin_notifications` table (not `user_notifications`)
2. Set proper `notification_type` that `NotificationBox` understands
3. Include requester info and deep link

```sql
CREATE OR REPLACE FUNCTION notify_admin_on_staff_task_request()
RETURNS TRIGGER AS $$
DECLARE
  requester_name TEXT;
BEGIN
  IF NEW.is_request = true AND NEW.status = 'pending_approval' THEN
    -- Get requester name
    SELECT COALESCE(full_name, email) INTO requester_name 
    FROM profiles WHERE id = NEW.requested_by;
    
    -- Insert into admin_notifications for each admin
    INSERT INTO admin_notifications (
      notification_type, 
      title, 
      message, 
      urgency, 
      metadata,
      entity_type,
      entity_id
    )
    VALUES (
      'new_issue', -- Use existing type that NotificationBox handles
      CASE 
        WHEN NEW.title = 'Room Assignment Request' 
        THEN 'Room Request: ' || COALESCE(requester_name, 'Unknown User')
        ELSE 'New Task Request'
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
        'requester_id', NEW.requested_by
      ),
      'staff_task',
      NEW.id::text
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## Part 5: Update NotificationBox Click Handler

### Handle Deep Link from Metadata

**Update NotificationBox.tsx**:
```typescript
const handleNotificationClick = (notification: any) => {
  setIsOpen(false);
  markAsReadMutation.mutate(notification.id);
  
  // Check for action_url in metadata (for room assignment requests)
  const actionUrl = notification?.metadata?.action_url;
  if (actionUrl) {
    navigate(actionUrl);
    return;
  }
  
  // Existing switch statement...
};
```

---

## Part 6: Auto-Open Dialog on Access Assignments

### Update AccessAssignments.tsx

```typescript
// Add at component top
const [searchParams] = useSearchParams();
const assignUserId = searchParams.get('assign_user');

// Effect to auto-open dialog
useEffect(() => {
  if (assignUserId && personnel) {
    const personToAssign = personnel.find(p => p.id === assignUserId);
    if (personToAssign) {
      setSelectedPerson(personToAssign);
      setIsAssignDialogOpen(true);
    }
  }
}, [assignUserId, personnel]);
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/admin/NotificationBox.tsx` | Check metadata.action_url for deep linking |
| `src/pages/AccessAssignments.tsx` | Read `assign_user` param and auto-open dialog |
| `src/components/occupants/hooks/useRoomAssignment.ts` | Auto-complete room request task after assignment |

## Database Changes

| Change | Description |
|--------|-------------|
| Update trigger function | Insert into admin_notifications with proper deep link |
| Add new trigger | Auto-complete room request tasks when assignment created |

---

## Summary

| Before | After |
|--------|-------|
| Notification goes to `/tasks` | Notification goes to `/access-assignments?assign_user=X` |
| Admin must find user manually | Dialog auto-opens for the requesting user |
| Task stays "approved" forever | Task auto-completes when room is assigned |
| User sees "waiting to be assigned" | User sees their new room immediately |

This creates a seamless one-click workflow: Admin clicks notification → Assign room → Done.
