

# Fix: Maintenance Calendar Click + Schedule Dialog Room Selection

## Problems Found

1. **Calendar items are not clickable** — The `MaintenanceCalendar` renders schedule entries with `cursor-pointer` CSS but has **no `onClick` handler**. Clicking a date or item does nothing. There's no detail panel or expand behavior.

2. **Courtroom type doesn't link to rooms** — In `ScheduleMaintenanceDialog`, the room dropdown only appears when `space_type === "room"`. For "courtroom" (the default), it shows a plain text input, so `space_id` stays empty. The `MaintenanceScheduleList` then can't join room data, showing no room name.

3. **Calendar doesn't pad to start on correct weekday** — `eachDayOfInterval` returns days 1-31, but the grid assumes day 1 is Sunday. If March 1 is a Saturday, the grid is misaligned.

---

## Fix Plan

### 1. Make calendar items clickable with a detail panel
- Add state for `selectedDate` and `selectedSchedule`
- When clicking a calendar day cell, show the list of schedules for that day below the calendar
- When clicking a specific schedule item, show a detail card with title, description, room, priority, status, dates, notes
- Add proper visual feedback (selected day highlight)

### 2. Fix room selection for all space types
- In `ScheduleMaintenanceDialog`, show the rooms dropdown for **both** "courtroom" and "room" space types (since courtrooms are stored in the `rooms` table too)
- This ensures `space_id` is always set when a room/courtroom is selected

### 3. Fix calendar weekday alignment
- Add empty padding cells before day 1 based on `monthStart.getDay()` so the grid aligns correctly with Sun-Sat headers

### Files to modify

| File | Change |
|------|--------|
| `src/components/maintenance/MaintenanceCalendar.tsx` | Add click handlers, selected-day state, detail panel below calendar, fix weekday padding |
| `src/components/maintenance/ScheduleMaintenanceDialog.tsx` | Show room dropdown for "courtroom" space type too (not just "room") |

