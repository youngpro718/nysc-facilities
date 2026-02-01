
# Enhanced Standard User Dashboard - Practical Work Portal

## Overview

Redesigning the Standard User Dashboard to be a **practical daily work hub** with:
1. **Term Sheet at the top** - See courtroom assignments at a glance (who's where, contact info)
2. **Activity status summary** - Quick view of pending requests/issues
3. **Pickup alerts** - Prominent notification when supplies are ready
4. **Quick actions** - Easy access to common tasks

## Design Philosophy

A standard user logging in should immediately see:
1. **What's happening in court today** (Term Sheet)
2. **What needs my attention** (Pickup alerts, pending items)
3. **What can I do** (Quick actions - request supplies, report issues)

## Current State vs. Proposed

| Section | Current | Proposed |
|---------|---------|----------|
| **Top of page** | Notification bell + action buttons | **Term Sheet Summary** (collapsed by default, expandable) |
| **Hero area** | UserWorkspaceCard (greeting + avatar) | Compact greeting + **Pickup Alert Banner** |
| **Main content** | Request Status Grid + expandable sections | **Tab-based activity view** (more scannable) |
| **Term info** | Not on page | **Always visible Term Sheet card** at top |

## Detailed Layout

```text
┌─────────────────────────────────────────────────────────────────────┐
│  Header: Compact greeting + Date + Notifications                    │
├─────────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ 📱 PICKUP ALERT BANNER (if any supplies ready)                │  │
│  │ "You have 2 orders ready for pickup at the Supply Room"       │  │
│  └───────────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ ⚖️ COURT TERM SHEET (expandable card)                        │  │
│  │                                                               │  │
│  │  Part 37  │ J. SMITH      │ Rm 1234 │ Ext 64081 │ [Expand ▼] │  │
│  │  Part 51  │ A. NEWBAUER   │ Rm 1324 │ ...       │            │  │
│  │  Part 81  │ C. FARBER     │ Rm 1317 │ ...       │            │  │
│  │  ... (scrollable, searchable)                                │  │
│  │                                                               │  │
│  │  [View Full Term Sheet →]                                     │  │
│  └───────────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐                                    │
│  │ 📦 Request  │ │ 🔧 Report   │   QUICK ACTIONS                    │
│  │  Supplies   │ │   Issue     │                                    │
│  └─────────────┘ └─────────────┘                                    │
├─────────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ MY ACTIVITY                                                   │  │
│  │ [Supplies (2)] [Issues (1)] [Keys (0)]                       │  │
│  │                                                               │  │
│  │  Request #123 - Office Supplies      [Picking Items] 60%     │  │
│  │  Request #124 - Printer Toner        [Ready] ← ACTION NEEDED │  │
│  │                                                               │  │
│  │  [View All Activity →]                                        │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

## Key Components to Create/Modify

### 1. NEW: `TermSheetPreview` Component

A compact, mobile-friendly preview of the term sheet with:
- Collapsible rows showing Part, Justice, Room, Extension
- Search/filter capability
- Link to full `/term-sheet` page
- Highlights user's own assignment (if applicable)

### 2. MODIFY: `UserDashboard.tsx`

Reorganize the layout:
1. Move `UserWorkspaceCard` to a more compact header format
2. Add `TermSheetPreview` as the first major section
3. Keep `PickupAlertBanner` prominent
4. Simplify activity section with inline tabs instead of expandable cards

### 3. ENHANCE: Activity Section

Instead of 3 expandable cards, use:
- Horizontal scrolling tab buttons (Supplies | Issues | Keys)
- Single content area that switches based on active tab
- Cleaner, more scannable layout

## Technical Implementation

### Files to Create

| File | Purpose |
|------|---------|
| `src/components/user/TermSheetPreview.tsx` | Compact term sheet viewer for dashboard |
| `src/components/user/CompactActivitySection.tsx` | Tab-based activity viewer |
| `src/components/user/CompactHeader.tsx` | Streamlined greeting header |

### Files to Modify

| File | Change |
|------|--------|
| `src/pages/UserDashboard.tsx` | Complete layout reorganization |

### Data Requirements

The Term Sheet data already exists via `court_assignments` table:
- `part` - Court part number
- `justice` - Justice name
- `room_number` - Courtroom number  
- `tel` - Phone extension
- `clerks` - Array of clerk names
- `sergeant` - Sergeant name

We can reuse the query pattern from `TermSheetBoard.tsx`.

## Mobile Considerations

- Term Sheet: Horizontal scroll for table on mobile, or card-based view
- Activity tabs: Scrollable horizontally on small screens
- Quick actions: 2-column grid on mobile
- Touch targets: Minimum 44px for all interactive elements

## User Experience Flow

1. **Login** → Land on Dashboard
2. **Immediately see** → Pickup alert (if any) + Term Sheet
3. **Know where everyone is** → Scan term sheet for room/extension info
4. **Check my requests** → Activity section shows status
5. **Take action** → Quick action buttons for new requests

## Benefits

1. **Practical**: Term sheet is what employees actually need daily
2. **Actionable**: Clear pickup alerts and quick actions
3. **Scannable**: Less expandable sections, more inline content
4. **Mobile-first**: Optimized for quick checks on phone
5. **Unified**: All activity in one scrollable section

## Implementation Order

1. Create `TermSheetPreview` component (reuses existing query)
2. Create `CompactHeader` component  
3. Create `CompactActivitySection` component (tabs instead of accordions)
4. Update `UserDashboard.tsx` with new layout
5. Test mobile responsiveness
