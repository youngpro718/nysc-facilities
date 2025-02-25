# Functionality Documentation

## Core Features

### Space Management

#### Connection Management
```typescript
interface SpaceConnection {
  id: string;
  from_space_id: string;
  to_space_id: string;
  space_type: string;
  connection_type: string;
  direction?: string;
  position?: string;
  status: ConnectionStatus;
  metadata: Record<string, any>;
}
```

1. Creating Connections
   - Select connection type (room/hallway/door)
   - Choose target space
   - Set connection properties
   - Submit for creation

2. Viewing Connections
   - List view of existing connections
   - Filtering and sorting options
   - Connection status indicators

3. Deleting Connections
   - Confirmation dialog
   - Cascade deletion handling
   - Status updates

### Occupant Management

#### Assignment System
```typescript
interface OccupantAssignment {
  id: string;
  occupant_id: string;
  room_id: string;
  assignment_type: string;
  start_date: string;
  end_date?: string;
}
```

1. Room Assignments
   - Multiple room support
   - Primary office designation
   - Assignment history tracking

2. Key Assignments
   - Key tracking
   - Return date management
   - Spare key allocation

### Data Flow

#### Client-Side
1. React Query Hooks
   - Data fetching
   - Cache management
   - Optimistic updates

2. Form Management
   - react-hook-form for form state
   - zod for validation
   - Error handling

#### Server-Side
1. Supabase Integration
   - Real-time subscriptions
   - RLS policies
   - Database triggers

### Floor Plan Management

#### Interactive Floor Plan
```typescript
interface FloorPlanState {
  selectedFloorId: string | null;
  selectedObject: any | null;
  zoom: number;
}
```

1. Floor Selection
   - Dropdown selection of floors
   - Visual floor selector with building grouping
   - Real-time floor data loading

2. Object Manipulation
   - Room, door, and hallway placement
   - Object resizing and rotation
   - Connection management between objects
   - Properties panel for object editing

3. View Controls
   - Zoom in/out (0.5x to 2x)
   - Pan and reset view
   - Undo/redo support for state changes

4. State Management
   ```typescript
   const { state, setState, canUndo, canRedo, undo, redo } = useUndo<FloorPlanState>({
     selectedFloorId: null,
     selectedObject: null,
     zoom: 1
   });
   ```

#### Node Types
1. Room Nodes
   - Resizable containers
   - Multiple connection points
   - Room number and type display
   - Status indicators

2. Door Nodes
   - Rotatable elements
   - Hardware status tracking
   - Connection validation
   - Status-based styling

3. Hallway Nodes
   - Extended connection support
   - Flexible sizing
   - Multiple entry/exit points

#### Connection Management
```typescript
interface Connection {
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}
```

1. Connection Rules
   - Validation of connection types
   - Prevention of invalid connections
   - Handle positioning
   - Visual feedback

2. Connection State
   - Real-time updates
   - Undo/redo support
   - Error handling

## API Endpoints

### Space Management
- GET /spaces
- POST /spaces
- GET /spaces/:id/connections
- POST /spaces/:id/connections
- DELETE /spaces/:id/connections/:connectionId

### Occupant Management
- GET /occupants
- POST /occupants
- PUT /occupants/:id
- GET /occupants/:id/assignments
- POST /occupants/:id/assignments

## State Management

### React Query Usage
```typescript
const { data, isLoading } = useQuery({
  queryKey: ['spaces'],
  queryFn: fetchSpaces
});
```

### Local State
```typescript
const [selectedSpace, setSelectedSpace] = useState<string | null>(null);
```

## Error Handling

### API Errors
```typescript
try {
  await createConnection(data);
} catch (error) {
  console.error('Error:', error);
  toast.error('Failed to create connection');
}
```

### Form Validation
```typescript
const schema = z.object({
  name: z.string().min(1),
  type: z.enum(['room', 'hallway', 'door'])
});
```

## Performance Considerations

### Query Optimization
- Pagination implementation
- Selective loading
- Cache strategies

### Real-time Updates
- Subscription management
- Optimistic updates
- Conflict resolution
