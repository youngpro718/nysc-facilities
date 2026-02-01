

# Fix RLS Policy for Admin Notifications + Add Favorite Room Display

## Problems Identified

### 1. RLS Policy Blocking Trigger Inserts

**Root Cause**: The `notify_admin_on_staff_task_request()` trigger function tries to INSERT into `admin_notifications`, but the only INSERT policy requires the user to be an admin:

```sql
-- Current policy (FOR ALL requires admin role)
"Admins can manage notifications" 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'))
```

When a regular user submits a room assignment request, the trigger runs in their context (not admin), so the INSERT fails with "violates row-level security policy".

**Solution**: Make the trigger function `SECURITY DEFINER` so it runs with elevated privileges (the function owner's permissions), bypassing RLS when inserting notifications. This is the standard pattern for system-generated notifications.

### 2. Favorite Room Display

**Current State**: 
- Users can see their assigned room in the Settings page (`MyRoomSection.tsx`)
- The dashboard header (`CompactHeader.tsx`) shows room number if available
- But there's no prominent "My Room" quick-access display on the main dashboard

**User's Request**: Make the user's assigned room appear prominently as a "favorite" - similar to how favorite supply items appear in `FavoritesStrip`.

**Solution**: Add a "My Room" card to the user dashboard that shows their primary room assignment with quick navigation to view room details.

---

## Part 1: Fix the RLS Policy Issue

### Option A: Make Trigger SECURITY DEFINER (Recommended)

Add `SECURITY DEFINER` to the trigger function so it can insert notifications regardless of who triggers it:

```sql
CREATE OR REPLACE FUNCTION public.notify_admin_on_staff_task_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER          -- ADD THIS LINE
SET search_path = public
AS $function$
DECLARE
  requester_name TEXT;
BEGIN
  -- ... existing logic unchanged ...
END;
$function$;
```

### Option B: Add Service Role Policy (Alternative)

Add an INSERT policy that allows the trigger to insert. However, triggers run as the invoking user unless `SECURITY DEFINER` is set, so this won't work without Option A.

**Recommendation**: Use Option A - it's the cleanest and follows the same pattern used by other notification triggers in the system.

---

## Part 2: Add "My Room" Favorite Display

### Create MyRoomCard Component

A compact card for the user dashboard showing their primary room assignment:

```typescript
// src/components/user/MyRoomCard.tsx

interface MyRoomCardProps {
  userId: string;
}

export function MyRoomCard({ userId }: MyRoomCardProps) {
  const { data: assignments } = useOccupantAssignments(userId);
  
  // Find primary room or first assigned room
  const primaryRoom = assignments?.roomDetails?.find(a => a.is_primary) 
    || assignments?.roomDetails?.[0];
  
  if (!primaryRoom?.rooms) {
    return null; // Don't show card if no room assigned
  }
  
  const room = primaryRoom.rooms;
  
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <MapPin className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">
                Room {room.room_number || room.name}
              </span>
              <Badge variant="secondary" className="text-xs gap-1">
                <Star className="h-3 w-3 fill-current" />
                My Room
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {room.floors?.name} • {room.floors?.buildings?.name}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Add to User Dashboard

Insert the MyRoomCard after the header section in UserDashboard.tsx:

```typescript
// After CompactHeader, before PickupAlertBanner
<MyRoomCard userId={user.id} />
```

---

## Files to Modify

| File | Changes |
|------|---------|
| Database trigger | Add `SECURITY DEFINER` to `notify_admin_on_staff_task_request()` |
| `src/components/user/MyRoomCard.tsx` | **New file** - Compact room display card |
| `src/pages/UserDashboard.tsx` | Import and add `<MyRoomCard />` component |

---

## Database Migration

```sql
-- Make the notification trigger run with elevated privileges
-- so it can insert admin notifications regardless of who triggers it
CREATE OR REPLACE FUNCTION public.notify_admin_on_staff_task_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
      related_id
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
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$function$;
```

---

## Summary

| Issue | Fix |
|-------|-----|
| RLS blocks trigger inserts | Add `SECURITY DEFINER` to trigger function |
| No favorite room display | Create `MyRoomCard` component for dashboard |

### Expected Results

1. Users can successfully request a room assignment without RLS errors
2. Admin receives notification with deep link to assignment page
3. Users see their primary room prominently on the dashboard with a "star" badge
4. Room info appears even more visibly (currently only in header badge on desktop)

