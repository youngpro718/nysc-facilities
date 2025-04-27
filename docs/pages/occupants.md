
# Occupants Management

## Overview
The Occupants page provides tools for managing the people who use the facilities, including court personnel, administrative staff, and other individuals who require access to building spaces and resources.

## Location
- **Route**: `/occupants`
- **Component**: `src/pages/Occupants.tsx`

## Access Control
- **Requires Authentication**: Yes
- **Role Required**: Admin
- **Protected By**: `ProtectedRoute` component with `requireAdmin` flag

## Key Features
- Occupant profile management
- Room assignments
- Key assignments and tracking
- Access control management
- Occupant search and filtering
- Bulk actions for multiple occupants

## Components Used
- **OccupantListView**: Main component for viewing occupants
- **OccupantCard**: Card representation of an occupant
- **OccupantTable**: Table view of occupants
- **CreateOccupantDialog**: Dialog for creating new occupants
- **AssignRoomsDialog**: Dialog for assigning rooms to occupants
- **AssignKeysDialog**: Dialog for assigning keys to occupants
- **OccupantFilters**: Filtering options for occupants

## Data Sources
- Occupant profiles from Supabase
- Room assignment data
- Key assignment data
- Access control information

## Key Files
- `src/pages/Occupants.tsx` - Main occupants page component
- `src/components/occupants/views/OccupantListView.tsx` - List view component
- `src/components/occupants/OccupantCard.tsx` - Card representation
- `src/components/occupants/OccupantTable.tsx` - Table representation
- `src/components/occupants/CreateOccupantDialog.tsx` - Creation dialog
- `src/components/occupants/AssignRoomsDialog.tsx` - Room assignment dialog
- `src/components/occupants/AssignKeysDialog.tsx` - Key assignment dialog
- `src/components/occupants/OccupantFilters.tsx` - Filtering component
- `src/components/occupants/hooks/useOccupantList.ts` - Data fetching

## State Management
- React Query for data operations
- Form state for occupant creation and editing
- Filter state for list filtering
- Modal state for dialogs

## Visual Elements
- List/card/table view toggle
- Search and filter controls
- Status indicators
- Assignment visualizations
- Bulk action controls

## Screenshots
[Add screenshots here]

## Future Improvements
- Advanced search capabilities
- Integration with HR systems
- Automated access provisioning
- Occupant onboarding/offboarding workflows
- Access history and audit trails
