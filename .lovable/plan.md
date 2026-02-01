
# Complete User Flow Audit & Fix Plan

## What I Found

I traced through every entry point a standard user can access and identified **5 key issues** that are causing the inconsistent experience.

---

## Issue 1: `/request/help` is a Separate Page (Not a Wizard)

**Current Behavior:**
- UserDashboard "Request Help" button → navigates to `/request/help`
- RequestHub "Request Help" card → navigates to `/request/help`  
- SimpleReportWizard "Request Room Assignment" CTA → navigates to `/request/help`

**The Problem:**
`/request/help` is the `HelpRequestPage.tsx` - a full-page 2-step form for creating staff tasks (move furniture, deliveries, etc.). This is working correctly and is a **different feature** from issue reporting.

**However**, when `SimpleReportWizard` says "Request Room Assignment" and sends users to `/request/help`, it's confusing because:
1. Users expect to get a room assigned, not request help moving furniture
2. This breaks the flow - user has to start over after navigating away

---

## Issue 2: Room Assignment Data Not Reaching Wizard

**Current Behavior in `useOccupantAssignments.ts`:**
- Resolves occupant by email matching
- Returns `roomAssignments` with `room_id`, `room_number`, `building_name`, `floor_name`, etc.

**Current Behavior in `SimpleReportWizard.tsx`:**
- Receives `assignedRooms` prop
- Uses helper functions `getRoomId(room)` and `getRoomNumber(room)`

**The Problem:**
The data shape from `useOccupantAssignments` uses `room_id` as the ID field, and the wizard correctly uses `getRoomId()` which tries `room.room_id || room.id`. This should work.

BUT - let me verify the actual data flow:
1. `MyIssues.tsx` passes `occupantData?.roomAssignments`
2. `MyActivity.tsx` passes `occupantData?.roomAssignments`
3. `QuickIssueReportButton.tsx` passes `occupantData?.roomAssignments`

All three pass the same data. The issue might be that `roomAssignments` is empty because:
- The user's email doesn't match any `occupants.email` record
- Or the occupant has no `occupant_room_assignments` rows

---

## Issue 3: "Request Room Assignment" Navigates Away

**Current Code (SimpleReportWizard.tsx line 196-199):**
```typescript
const handleRequestRoomAssignment = () => {
  onCancel?.();
  navigate('/request/help');
};
```

**The Problem:**
This closes the wizard and sends users to a different feature (staff task requests). Users expect to request a room assignment, not request help with moving.

**Should Instead:**
- Either create a proper "room assignment request" (which could be a staff task of type `general` with a specific title)
- Or navigate to a proper room assignment request flow
- Or allow users to continue with manual location input (which exists but isn't the primary CTA)

---

## Issue 4: MyRequests Mobile Still Uses Old Form

**Current Behavior (MyRequests.tsx line 215-220):**
```typescript
<MobileRequestForm 
  open={showMobileForm}
  onClose={() => setShowMobileForm(false)}
  onSubmit={handleSubmitRequest}
  type="key_request"
/>
```

This is for **key requests**, not issues, so it's actually correct. The `MobileRequestForm` for keys is a separate flow.

---

## Issue 5: Confirming All Entry Points Are Correct

Let me verify each entry point is now using the correct component:

| Entry Point | Component Used | Status |
|-------------|----------------|--------|
| UserDashboard → "Report Issue" | `QuickIssueReportButton` → `SimpleReportWizard` | Correct |
| MyIssues → "Report Issue" | `ResponsiveDialog` → `SimpleReportWizard` | Correct |
| MyActivity → Issues Tab → "Report Issue" | `ResponsiveDialog` → `SimpleReportWizard` | Correct |
| RequestHub → "Report Issue" | Navigates to `/my-issues?new=1` | Correct |

All issue reporting entry points appear to be wired correctly to `SimpleReportWizard`.

---

## Root Cause Analysis

The actual problems are:

### A. Assigned Rooms Not Showing
Users with room assignments aren't seeing them because:
1. Their `profiles.email` doesn't match `occupants.email` (case sensitivity, formatting)
2. OR they genuinely have no `occupant_room_assignments` rows

**Fix:** Add debug logging to trace the exact failure point, and ensure case-insensitive email matching is working.

### B. "Request Room Assignment" UX is Wrong
The CTA sends users to `/request/help` which is a completely different feature. 

**Fix:** Change this to either:
- Create a staff task with type `general` and a specific room-assignment-request template
- Or just emphasize the "Continue without a room" option as primary when no rooms are assigned

### C. Potential Race Condition
The `useOccupantAssignments` hook might not be loaded when the wizard renders, causing an empty `assignedRooms` prop initially.

---

## Implementation Plan

### Step 1: Fix "Request Room Assignment" Flow
**File: `src/components/issues/wizard/SimpleReportWizard.tsx`**

Change the "no assigned rooms" handling:
- Remove the navigation to `/request/help`
- Instead, create a staff task directly with type `general` and title "Room Assignment Request"
- Show a success message and let user continue with manual location input

### Step 2: Add Loading State for Room Assignments
**Files: `SimpleReportWizard.tsx`, `QuickIssueReportButton.tsx`, `MyIssues.tsx`, `MyActivity.tsx`**

Pass a loading state to the wizard so it can show a skeleton while fetching room assignments instead of immediately showing "No assigned rooms".

### Step 3: Improve Email Matching in Hook
**File: `src/hooks/occupants/useOccupantAssignments.ts`**

The current code already uses `.ilike()` for case-insensitive matching, but add `.trim()` on both sides and normalize the email format.

### Step 4: Add Debug Logging (Temporarily)
Add console logs to trace:
- What email is being looked up
- Whether an occupant was found
- How many room assignments were returned

This will help identify if the issue is data-related or code-related.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/issues/wizard/SimpleReportWizard.tsx` | Fix "Request Room Assignment" to create a staff task instead of navigating away; add loading state support |
| `src/components/user/QuickIssueReportButton.tsx` | Pass `isLoading` from useOccupantAssignments to wizard |
| `src/pages/MyIssues.tsx` | Pass `isLoading` from useOccupantAssignments to wizard |
| `src/pages/MyActivity.tsx` | Pass `isLoading` from useOccupantAssignments to wizard |
| `src/hooks/occupants/useOccupantAssignments.ts` | Add debug logging to trace resolution failures |

---

## Expected Outcome After Fix

1. **Users with assigned rooms:** See their room(s) pre-selected, can report in 3-4 taps
2. **Users without assigned rooms:** See a clear "No room assigned" state with:
   - Primary: "Request Room Assignment" (creates a staff task, shows confirmation)
   - Secondary: "Continue without a room" (allows manual location entry)
3. **No navigation away:** User stays in the wizard throughout the entire flow
4. **Proper loading:** Skeleton shown while fetching room data, not a premature "no rooms" message
