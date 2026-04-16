

# Fix: "1 task is overdue" alert showing cancelled tasks

## Root Cause
In `commandCenterService.ts` line 219-221, the overdue task filter:

```typescript
overdue: taskList.filter(t => 
  t.due_date && new Date(t.due_date) < now && t.status !== 'completed'
).length,
```

Only excludes `completed` tasks. **Cancelled tasks with past due dates are being counted as overdue.**

DB query confirms: there's exactly 1 task ("move") with status=`cancelled` and a past due date — that's the phantom "1 overdue."

For reference, `Tasks.tsx` already gets this right (line 54-56): it excludes both `completed` AND `cancelled`.

## Fix

One line change in `src/features/dashboard/services/commandCenterService.ts`:

```typescript
overdue: taskList.filter(t => 
  t.due_date && 
  new Date(t.due_date) < now && 
  t.status !== 'completed' && 
  t.status !== 'cancelled'
).length,
```

This will:
- Make the Command Center "Pending Tasks" card show `0 overdue` instead of `1 overdue`
- Remove the spurious "Overdue Tasks" alert (line 410 only fires when `overdue > 0`)

## Files to Change

| File | Change |
|------|--------|
| `src/features/dashboard/services/commandCenterService.ts` | Add `t.status !== 'cancelled'` to overdue filter (line 219-221) |

