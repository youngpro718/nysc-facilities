# Application Structure

## Overview
This React application is a facilities management system built with TypeScript, featuring a modular component architecture and integration with Supabase for backend services.

## Core Components

### Layout Components
- `Layout.tsx`: Main application layout with navigation and authentication state management
  - Handles responsive design
  - Manages auth state with Supabase
  - Provides navigation through React Router

### Space Management

#### Floor Plan Components
- `FloorPlanView.tsx`: Main floor plan interface component
  - Floor selection and visualization
  - Zoom and pan controls
  - Undo/redo functionality
  - Object selection and editing

- `FloorPlanCanvas.tsx`: Interactive canvas for floor plan editing
  - React Flow integration
  - Node and edge management
  - Connection validation
  - Real-time updates

- Node Components:
  - `RoomNode.tsx`: Room visualization and interaction
  - `DoorNode.tsx`: Door visualization and status
  - `HallwayNode.tsx`: Hallway connections and routing

- UI Components:
  - `VisualFloorSelector.tsx`: Building-grouped floor selection
  - `PropertiesPanel.tsx`: Object property editing
  - `EditPropertiesPanel.tsx`: Detailed property editing

#### Floor Plan Hooks
- `useUndo.ts`: Undo/redo state management
- `useFloorPlanData.ts`: Floor plan data fetching and caching
- `useNodeManagement.ts`: Node creation and updates
- `useConnectionValidation.ts`: Connection rule enforcement

### Space Management
- `SpaceConnectionManager.tsx`: Manages space connections between rooms, hallways, and doors
  - Handles creation and deletion of connections
  - Provides form interface for establishing connections
  - Uses React Query for data management

#### Connection Forms
- `ConnectedSpacesForm.tsx`: Multi-type connection form
- `RoomConnectionForm.tsx`: Room-specific connection form
- `HallwayConnectionForm.tsx`: Hallway-specific connection form
- `DoorConnectionForm.tsx`: Door-specific connection form

### Hooks
- `useSpaceConnections.ts`: Manages space connection data and mutations
- `useAvailableSpaces.ts`: Fetches available spaces for connections
- `useOccupantList.ts`: Manages occupant data and filtering
- `useOccupantAssignments.ts`: Handles occupant room and key assignments

### Types
- `ConnectionTypes.ts`: Defines types for space connections
- `OccupantTypes.ts`: Defines types for occupant data
- `FloorPlanTypes.ts`: Defines types for floor plan visualization

## Pages
- `Spaces.tsx`: Main space management interface
  - Building and floor selection
  - Space type tabs (rooms, hallways, doors)
  - Connection management

## State Management
The application uses a combination of:
- React Query for server state
- React useState for local component state
- Supabase for real-time updates and data persistence

## File Organization
```
src/
├── components/
│   ├── spaces/
│   │   ├── connections/
│   │   ├── floorplan/
│   │   ├── hooks/
│   │   └── types/
│   ├── occupants/
│   ├── issues/
│   └── layout/
├── integrations/
│   └── supabase/
├── hooks/
└── pages/
```

## Key Features
1. Space Management
   - Creation and management of rooms, hallways, and doors
   - Connection management between spaces
   - Floor plan visualization

2. Occupant Management
   - Assignment of rooms and keys
   - Status tracking
   - History management

3. Issue Tracking
   - Creation and management of maintenance issues
   - Status updates and resolution tracking

## Component Dependencies
- Most components rely on shadcn/ui for base UI elements
- Supabase integration for data persistence
- React Query for server state management
- React Router for navigation
