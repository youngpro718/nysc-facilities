
# Issue Management Audit & Admin Quick Report Plan

## Part 1: Database Cleanup

### Current Test Issues Found
I found 12+ test issues in the database. Here's what they look like:

| Title | Description | Status | Created |
|-------|-------------|--------|---------|
| PLUMBING_NEEDS Issue | bathroom | open | Oct 30, 2025 |
| Lighting Issue - ballast_issue | LED bulb | open | Aug 31, 2025 |
| CLEANING_REQUEST Issue - Deep Clean | (empty) | open | Aug 19, 2025 |
| ACCESS_REQUEST Issue - Key Issues | (empty) | open | Aug 17, 2025 |
| ELECTRICAL_NEEDS Issue - Lighting | bulb replacement | open | Aug 17, 2025 |
| ...and 7 more similar test entries |

To clean these up, you have two options:
1. **I can provide a SQL query** to delete all test issues in one go
2. **Delete them manually** through the Operations page (one by one)

---

## Part 2: Admin Quick Issue Report

### Current Problem
As a facility coordinator, you currently have to:
1. Navigate to Operations → Report Issue
2. Fill out: Title, Description, Space Type, Room (dropdown of ALL rooms), Issue Type, Severity
3. No recent rooms, no photo upload, no quick actions

**That's 6+ taps/clicks minimum**, and no photos.

### Proposed Solution: Admin Quick Report

A streamlined reporting flow designed for facility coordinators who need to report issues on the go:

```text
┌─────────────────────────────────────────────────────────────┐
│ Quick Report                                       [×] Close│
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  RECENT ROOMS                                                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │ 1609     │ │ 1616     │ │ Lobby    │ │ 1109A    │        │
│  │ Jury Rm  │ │ Courtroom│ │ Main     │ │ Office   │        │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘        │
│                                                              │
│  Or search: [🔍 Type room number...           ]              │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│  ISSUE TYPE (tap to select)                                  │
│                                                              │
│  ⚡ Electrical    🔧 Maintenance    ❄️ HVAC                   │
│  🚿 Plumbing      🧹 Cleaning       ⚠️ Safety                 │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│  📷 Add Photos (tap or drag)                                 │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              [Camera icon]                               ││
│  │         Tap to take photo or upload                      ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
├─────────────────────────────────────────────────────────────┤
│  DESCRIPTION (optional)                                      │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Quick notes about the issue...                          ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│                           [Submit Report]                    │
└─────────────────────────────────────────────────────────────┘
```

### The 4-5 Tap Flow

1. **Tap** recent room OR search and tap room result
2. **Tap** issue type (Electrical, HVAC, etc.)
3. **Tap** camera button (optional - take photo)
4. **Tap** Submit

That's 3-4 taps minimum (5 if adding a photo).

---

## Technical Implementation

### New Component: `AdminQuickReportDialog.tsx`

A new dialog component with:

| Feature | Implementation |
|---------|----------------|
| **Recent Rooms** | Track last 8 rooms used in localStorage, show as quick-select chips |
| **Room Search** | Autocomplete searching all rooms (room_number, name) |
| **Quick Issue Types** | 6 large tap targets with icons (same as user flow) |
| **Photo Upload** | Reuse existing `IssuePhotoForm` component |
| **Description** | Single textarea, optional |
| **Auto-fill** | building_id, floor_id auto-filled from room selection |

### Files to Create/Modify

1. **Create**: `src/components/issues/admin/AdminQuickReportDialog.tsx`
   - New streamlined dialog for admins
   - Recent rooms from localStorage
   - Room search with autocomplete
   - Quick issue type selector
   - Photo upload
   - Description field

2. **Create**: `src/hooks/useRecentRooms.ts`
   - Track last 8 rooms reported for in localStorage
   - `addRecentRoom(roomId, roomName, roomNumber)` 
   - `getRecentRooms()` returns last 8

3. **Modify**: `src/pages/Operations.tsx`
   - Replace "Report Issue" button to open new `AdminQuickReportDialog`

4. **Modify**: `src/pages/AdminDashboard.tsx` (optional)
   - Add floating action button for quick reporting

### Room Search Component

```text
Search behavior:
- Type "16" → Shows: 1609, 1616, 1617, etc.
- Type "jury" → Shows: Jury Room 1, Jury Room 2
- Type "court" → Shows: All courtrooms
- Tap result → Auto-selects room + fills building/floor
```

### Photo Upload

Reuse the existing photo upload infrastructure:
- Same `issue-photos` storage bucket (already exists and is public)
- Same upload logic from `ReportIssueWizard`
- Support camera access on mobile

---

## User Permissions

| User Type | Can Use Admin Quick Report? |
|-----------|------------------------------|
| Regular User | No - uses existing wizard with assigned rooms |
| Court Aide | No - uses existing wizard |
| Facility Coordinator | Yes - can report for any room |
| Administrator | Yes - can report for any room |

The quick report will check `isAdmin` or `role === 'facilities_manager'` before showing.

---

## What Regular Users Keep

Their existing flow remains unchanged:
- Dashboard → Quick Report widget → Their assigned rooms only
- 4-step wizard with contact info pre-filled
- They report for their room(s), no need to search

---

## Summary

### For You (Admin/Facility Coordinator)
- New "Quick Report" button in Operations
- Recent rooms shown first (no scrolling through dropdowns)
- Room search by number or name
- Photo upload built in
- **3-5 taps to report an issue**

### For Regular Users
- Same flow as before
- Report for their assigned room(s)
- No photo requirement (you mentioned this isn't necessary for them)

### Database Cleanup
I'll provide a SQL query or handle deletion through the app once you confirm you want the test data removed.
