
# Relocations Management

## Overview
The Relocations page manages the process of moving occupants, equipment, and resources between different spaces within the facilities. It provides tools for planning, scheduling, and tracking relocation activities.

## Location
- **Route**: `/relocations`
- **Component**: `src/pages/Relocations.tsx`

## Access Control
- **Requires Authentication**: Yes
- **Role Required**: Admin
- **Protected By**: `ProtectedRoute` component with `requireAdmin` flag

## Key Features
- Relocation planning and scheduling
- Resource allocation for moves
- Move status tracking
- Notification system for affected parties
- Schedule management and conflicts
- Relocation history

## Components Used
- **RelocationsDashboard**: Main dashboard for relocations
- **CreateRelocationForm**: Form for creating new relocations
- **RelocationDetails**: Detailed view of a relocation
- **DateSelectionSection**: For scheduling relocations
- **RoomSelectionSection**: For selecting source and destination rooms

## Data Sources
- Relocation data from Supabase
- Room availability information
- Occupant data
- Schedule information

## Key Files
- `src/pages/Relocations.tsx` - Main relocations page component
- `src/pages/CreateRelocation.tsx` - Create/edit relocation page
- `src/components/relocations/dashboard/RelocationsDashboard.tsx` - Dashboard
- `src/components/relocations/forms/CreateRelocationForm.tsx` - Creation form
- `src/components/relocations/details/RelocationDetails.tsx` - Details view
- `src/components/relocations/forms/sections/DateSelectionSection.tsx` - Date selection
- `src/components/relocations/forms/sections/RoomSelectionSection.tsx` - Room selection
- `src/components/relocations/hooks/useRelocations.ts` - Data fetching

## State Management
- React Query for data operations
- Form state for relocation creation and editing
- Filter state for dashboard filtering
- Notification state for alerts

## Visual Elements
- Calendar view of scheduled relocations
- Status badges for relocation states
- Room selection visualizations
- Timeline for relocation activities
- Notification alerts

## Screenshots
[Add screenshots here]

## Future Improvements
- Equipment inventory integration
- Automated resource allocation
- Vendor management for external moves
- Cost estimation and budgeting
- Post-move feedback collection
