
# Spaces Management

## Overview
The Spaces page allows administrators to manage all physical spaces within the facilities, including rooms, hallways, and doors. It provides tools for space creation, editing, and visualization.

## Location
- **Route**: `/spaces`
- **Component**: `src/pages/Spaces.tsx`

## Access Control
- **Requires Authentication**: Yes
- **Role Required**: Admin
- **Protected By**: `ProtectedRoute` component with `requireAdmin` flag

## Key Features
- Space inventory management (rooms, hallways, doors)
- Space details editing
- Connection management between spaces
- Space visualization (list, grid, floorplan views)
- Space search and filtering
- Inventory management for rooms

## Components Used
- **SpacesTabs**: Tab navigation for different space types
- **RoomsList/HallwaysList/DoorsList**: Lists of different space types
- **SpaceCard**: Card representation of a space
- **CreateSpaceDialog**: Dialog for creating new spaces
- **EditSpaceDialog**: Dialog for editing existing spaces
- **FloorPlanView**: Visual representation of spaces and connections
- **SpaceConnectionManager**: Manages connections between spaces

## Data Sources
- Spaces data from Supabase tables
- Connection data between spaces
- Room inventory data
- Space metadata and properties

## Key Files
- `src/pages/Spaces.tsx` - Main spaces page component
- `src/components/spaces/SpacesTabs.tsx` - Tab navigation
- `src/components/spaces/RoomsList.tsx` - Rooms list component
- `src/components/spaces/HallwaysList.tsx` - Hallways list component
- `src/components/spaces/DoorsList.tsx` - Doors list component
- `src/components/spaces/CreateSpaceDialog.tsx` - Space creation dialog
- `src/components/spaces/EditSpaceDialog.tsx` - Space editing dialog
- `src/components/spaces/floorplan/FloorPlanView.tsx` - Floorplan visualization
- `src/components/spaces/SpaceConnectionManager.tsx` - Connection management

## State Management
- Uses React Query for data fetching
- Context for shared space state
- Form state for creation and editing

## Visual Elements
- Tab navigation for space types
- List/grid toggle for different views
- Interactive floorplan visualization
- Forms for space creation and editing
- Connection visualization between spaces

## Screenshots
[Add screenshots here]

## Future Improvements
- Enhanced 3D visualization
- Batch editing tools
- Advanced search capabilities
- Space utilization analytics
- Space reservation system
