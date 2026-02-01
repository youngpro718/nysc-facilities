
# Add List View and Card View Toggle to Supply Room

## Overview

Add the ability to switch between a card (grid) view and a list (table) view in the Supply Room dashboard, similar to the view toggle used in other parts of the application like Issues and Rooms.

## Current State

The Supply Room Staff dashboard (`ImprovedSupplyStaffDashboard.tsx`) currently only displays orders in a card grid layout using `SimpleOrderCard` components. There's no option to switch to a compact table/list view.

## What Will Change

Users will see a view toggle button group in the Supply Room that allows switching between:
- **Card View**: The current grid of detailed order cards (default)
- **List View**: A compact table showing order information in rows

---

## Implementation Details

### 1. Create a View Toggle Component

A simple toggle component using the existing `ToggleGroup` from the UI library:
- Two buttons: Grid icon (cards) and List icon (table)
- Placed in the header area near the search input

### 2. Create Order Table View Component

A new `OrderTableView` component that displays orders in a table format:

| Order # | Requester | Department | Location | Items | Priority | Status | Time | Actions |
|---------|-----------|------------|----------|-------|----------|--------|------|---------|
| ABC123  | John Doe  | Admin      | Room 101 | 3     | High     | New    | 2h   | Fulfill |

Features:
- Compact row-based display
- Priority and status badges
- Quick-action "Fulfill" button per row
- "Confirm Picked Up" action for ready orders
- Sortable columns (future enhancement)

### 3. Update Supply Staff Dashboard

Modify `ImprovedSupplyStaffDashboard.tsx` to:
- Add a `viewMode` state (`'cards' | 'list'`)
- Add the view toggle UI next to the search bar
- Conditionally render either `SimpleOrderCard` grid or `OrderTableView` based on selected view
- Persist view preference in localStorage (optional enhancement)

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/supply/OrderTableView.tsx` | Table/list view for supply orders |
| `src/components/supply/SupplyViewToggle.tsx` | View toggle button group |

## Files to Modify

| File | Change |
|------|--------|
| `src/components/supply/ImprovedSupplyStaffDashboard.tsx` | Add view toggle state and conditional rendering |

---

## User Experience

1. User visits the Supply Room page
2. By default, they see the familiar card grid view
3. They can click the List icon to switch to a compact table view
4. The view preference persists during the session
5. All functionality (fulfill, confirm pickup) works in both views
