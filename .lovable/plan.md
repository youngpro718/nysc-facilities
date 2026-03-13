

# Two Fixes: Sergeant Last-Name-Only + Room Number Overwrite

## Issue 1: Sergeant Name Validation Too Strict

**File:** `src/components/spaces/court/AddStaffDialog.tsx`

Line 111: `const canSubmit = firstName.trim() && lastName.trim();` requires both first AND last name for all roles including sergeants.

**Fix:** When role is `sergeant` or `officer`, only require last name. Change validation to:
```typescript
const canSubmit = role === 'sergeant' || role === 'officer'
  ? lastName.trim()
  : firstName.trim() && lastName.trim();
```

Also update the UI to mark First Name as optional for sergeants (remove the `*` indicator and adjust the label).

In the mutation call, allow the name to be just the last name for sergeants — `addNewStaff` receives `firstName` which can be empty.

## Issue 2: Room Number Always Overwritten to "X21" on Mobile

**File:** `src/components/spaces/RoomPreviewCard.tsx`

**Root cause:** The `useEffect` on lines 75-96 calls `generateSmartRoomNumber()` every time `floorId`, `buildingId`, `floors`, or `roomType` changes. The `floors` query result object changes on re-renders, and this effect fires *after* the user manually types a room number, overwriting their input with the auto-generated number (e.g., "1621").

**Fix:** Add a `hasManuallyEditedNumber` ref that gets set to `true` when the user edits the room number input. Skip the `useEffect` regeneration if the user has manually edited the number. Only auto-generate on initial load or when building/floor selection actually changes.

Track whether the floor/building actually changed (not just re-rendered) using previous value comparison, and skip regeneration if the user is in edit mode or has manually set a value.

## Files to Modify

| File | Change |
|------|--------|
| `src/components/court/AddStaffDialog.tsx` | Make first name optional for sergeants; update `canSubmit` logic and label |
| `src/components/spaces/RoomPreviewCard.tsx` | Add manual-edit tracking ref; skip auto-regeneration when user has edited the room number |

