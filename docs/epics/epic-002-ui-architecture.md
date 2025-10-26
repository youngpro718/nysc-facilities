# Epic 002: UI Architecture & Route Standardization

**Epic ID:** EPIC-002  
**Title:** UI Architecture Standardization with Service-Layer Enforcement  
**Status:** ✅ Complete  
**Priority:** 🔴 Critical  
**Target:** Sprint 3-4 (4 weeks)  
**Owner:** Frontend Architecture Team  
**Created:** October 25, 2025  
**Completed:** October 25, 2025

---

## 📋 Executive Summary

Standardize the UI architecture with a clean route structure and enforce service-layer data access patterns. This epic consolidates the current 40+ routes into a logical hierarchy with four core routes (`/`, `/facilities`, `/facilities/:id`, `/ops`) and establishes architectural patterns that prevent direct database access from components.

---

## 🎯 Goals & Objectives

### Primary Goals
1. **Route Consolidation** - Reduce 40+ routes to logical hierarchy
2. **Service-Layer Enforcement** - All data access through services
3. **Consistent Patterns** - Standardized component architecture
4. **Performance** - Optimized data fetching and caching
5. **Maintainability** - Clear separation of concerns

### Success Criteria
- ✅ Four core routes implemented with consistent patterns
- ✅ Zero direct Supabase imports in page/component files
- ✅ All data access through service layer
- ✅ React Query for all server state management
- ✅ Loading/error/empty states standardized
- ✅ Route protection and module access working
- ✅ Performance benchmarks met (< 500ms page load)

---

## 🗺️ Proposed Route Architecture

### **Route Hierarchy**

```
┌─────────────────────────────────────────────────────────────┐
│                    NYSC Facilities Hub                       │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
                ▼             ▼             ▼
        ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
        │      /       │ │ /facilities  │ │    /ops      │
        │  Dashboard   │ │   Spaces     │ │  Operations  │
        └──────────────┘ └──────┬───────┘ └──────────────┘
                                │
                                ▼
                        ┌──────────────┐
                        │/facilities/:id│
                        │ Facility View│
                        └──────────────┘
```

---

## 📐 Core Routes Definition

### **Route 1: Dashboard (`/`)**

**Purpose:** Central hub for admin users with overview of all systems

**URL Structure:**
```
/                           # Admin dashboard (default)
/dashboard                  # User dashboard (non-admin)
```

**Page Component:** `src/pages/Dashboard.tsx`

**Features:**
- Building overview cards
- System statistics (rooms, issues, keys, personnel)
- Recent activity feed
- Quick actions (create room, report issue, etc.)
- Module cards (Facilities, Operations, Court Ops)
- Real-time notifications

**Data Requirements:**
- Dashboard statistics
- Building summary
- Recent issues/requests
- User notifications
- Module status

**Services Used:**
```typescript
// src/services/dashboard/dashboardService.ts
- getDashboardStats()
- getBuildingSummary()
- getRecentActivity()
- getModuleStatus()
```

**State Management:**
```typescript
// Custom hooks
- useDashboardData()
- useBuildingSummary()
- useRecentActivity()
- useNotifications()
```

---

### **Route 2: Facilities (`/facilities`)**

**Purpose:** Comprehensive facility management (rooms, buildings, floors)

**URL Structure:**
```
/facilities                 # Facilities overview (list view)
/facilities?building=:id    # Filter by building
/facilities?floor=:id       # Filter by floor
/facilities?type=:type      # Filter by room type
/facilities?view=grid       # Grid view (default)
/facilities?view=list       # List view
/facilities?view=map        # Floor plan view
```

**Page Component:** `src/pages/Facilities.tsx`

**Features:**
- Building/floor hierarchy navigation
- Room grid/list/map views
- Advanced filtering (type, status, capacity)
- Search functionality
- Bulk operations
- Room creation/editing
- Floor plan visualization (3D)

**Data Requirements:**
- Buildings list
- Floors by building
- Rooms with filters
- Room details
- Occupancy data
- Floor plan data

**Services Used:**
```typescript
// src/services/facilities/facilitiesService.ts
- getBuildings()
- getFloors(buildingId)
- getRooms(filters)
- getRoomById(id)
- createRoom(data)
- updateRoom(id, data)
- deleteRoom(id)
- getBuildingHierarchy()
- getFloorPlanData(floorId)
```

**State Management:**
```typescript
// Custom hooks
- useBuildings()
- useFloors(buildingId)
- useRooms(filters)
- useRoom(id)
- useRoomMutations()
- useFloorPlan(floorId)
```

---

### **Route 3: Facility Detail (`/facilities/:id`)**

**Purpose:** Detailed view of a single facility (room/space)

**URL Structure:**
```
/facilities/:id             # Facility detail view
/facilities/:id?tab=info    # Information tab (default)
/facilities/:id?tab=issues  # Issues tab
/facilities/:id?tab=keys    # Keys & access tab
/facilities/:id?tab=history # History tab
/facilities/:id?tab=3d      # 3D view tab
```

**Page Component:** `src/pages/FacilityDetail.tsx`

**Features:**
- Room information display
- Occupancy details
- Related issues list
- Key assignments
- Access history
- 3D visualization
- Edit/delete actions
- Status management

**Data Requirements:**
- Room details
- Occupants list
- Issues for room
- Key assignments
- Access logs
- Change history
- 3D model data

**Services Used:**
```typescript
// src/services/facilities/facilityDetailService.ts
- getFacilityDetails(id)
- getFacilityOccupants(id)
- getFacilityIssues(id)
- getFacilityKeys(id)
- getFacilityHistory(id)
- updateFacilityStatus(id, status)
- getFacility3DModel(id)
```

**State Management:**
```typescript
// Custom hooks
- useFacilityDetails(id)
- useFacilityOccupants(id)
- useFacilityIssues(id)
- useFacilityKeys(id)
- useFacilityHistory(id)
- useFacilityMutations(id)
```

---

### **Route 4: Operations (`/ops`)**

**Purpose:** Unified operations hub (issues, maintenance, requests)

**URL Structure:**
```
/ops                        # Operations overview
/ops?tab=issues             # Issues tab (default)
/ops?tab=maintenance        # Maintenance tab
/ops?tab=keys               # Key requests tab
/ops?tab=supplies           # Supply requests tab
/ops?status=open            # Filter by status
/ops?priority=high          # Filter by priority
/ops?building=:id           # Filter by building
```

**Page Component:** `src/pages/Operations.tsx`

**Features:**
- Tabbed interface (Issues, Maintenance, Keys, Supplies)
- Compact room cards (8 per row)
- Status filtering
- Priority filtering
- Building filtering
- Quick actions (assign, resolve, close)
- Bulk operations
- Export functionality

**Data Requirements:**
- Issues list with filters
- Maintenance schedule
- Key requests
- Supply requests
- Building data for filters
- Personnel for assignments

**Services Used:**
```typescript
// src/services/operations/operationsService.ts
- getIssues(filters)
- getIssueById(id)
- createIssue(data)
- updateIssue(id, data)
- resolveIssue(id, resolution)
- getMaintenanceSchedule(filters)
- getKeyRequests(filters)
- getSupplyRequests(filters)
- assignIssue(id, userId)
- bulkUpdateIssues(ids, updates)
```

**State Management:**
```typescript
// Custom hooks
- useIssues(filters)
- useIssue(id)
- useIssueMutations()
- useMaintenanceSchedule(filters)
- useKeyRequests(filters)
- useSupplyRequests(filters)
- useBulkOperations()
```

---

## 🏗️ File Structure & Layout

### **Proposed Directory Structure**

```
src/
├── pages/                          # Route pages (thin, presentational)
│   ├── Dashboard.tsx               # / route
│   ├── Facilities.tsx              # /facilities route
│   ├── FacilityDetail.tsx          # /facilities/:id route
│   ├── Operations.tsx              # /ops route
│   ├── Login.tsx                   # /login route
│   ├── NotFound.tsx                # 404 route
│   └── legacy/                     # Legacy routes (to be migrated)
│       ├── Spaces.tsx              # → Facilities.tsx
│       ├── AdminDashboard.tsx      # → Dashboard.tsx
│       └── ...
│
├── components/                     # Reusable UI components
│   ├── dashboard/                  # Dashboard-specific components
│   │   ├── StatsCard.tsx
│   │   ├── BuildingOverview.tsx
│   │   ├── RecentActivity.tsx
│   │   └── ModuleCard.tsx
│   │
│   ├── facilities/                 # Facilities-specific components
│   │   ├── RoomCard.tsx
│   │   ├── RoomGrid.tsx
│   │   ├── RoomList.tsx
│   │   ├── FloorPlanViewer.tsx
│   │   ├── BuildingSelector.tsx
│   │   ├── RoomFilters.tsx
│   │   └── RoomForm.tsx
│   │
│   ├── facility-detail/            # Facility detail components
│   │   ├── FacilityInfo.tsx
│   │   ├── FacilityIssues.tsx
│   │   ├── FacilityKeys.tsx
│   │   ├── FacilityHistory.tsx
│   │   └── Facility3DView.tsx
│   │
│   ├── operations/                 # Operations-specific components
│   │   ├── IssueCard.tsx
│   │   ├── IssueList.tsx
│   │   ├── IssueFilters.tsx
│   │   ├── IssueForm.tsx
│   │   ├── MaintenanceSchedule.tsx
│   │   ├── KeyRequestList.tsx
│   │   └── SupplyRequestList.tsx
│   │
│   ├── common/                     # Shared components
│   │   ├── LoadingSkeleton.tsx
│   │   ├── ErrorMessage.tsx
│   │   ├── EmptyState.tsx
│   │   ├── SearchBar.tsx
│   │   ├── FilterPanel.tsx
│   │   └── Pagination.tsx
│   │
│   ├── layout/                     # Layout components
│   │   ├── Layout.tsx
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Navigation.tsx
│   │   └── Footer.tsx
│   │
│   └── ui/                         # Base UI components (shadcn/ui)
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       └── ...
│
├── services/                       # Service layer (data access)
│   ├── dashboard/
│   │   └── dashboardService.ts     # Dashboard data access
│   │
│   ├── facilities/
│   │   ├── facilitiesService.ts    # Facilities CRUD
│   │   ├── facilityDetailService.ts # Facility detail data
│   │   ├── buildingService.ts      # Building operations
│   │   └── floorService.ts         # Floor operations
│   │
│   ├── operations/
│   │   ├── operationsService.ts    # Operations data access
│   │   ├── issueService.ts         # Issue CRUD
│   │   ├── maintenanceService.ts   # Maintenance operations
│   │   ├── keyRequestService.ts    # Key request operations
│   │   └── supplyRequestService.ts # Supply request operations
│   │
│   ├── auth/
│   │   └── authService.ts          # Authentication
│   │
│   ├── core/
│   │   ├── supabaseClient.ts       # Supabase client (ONLY import here)
│   │   ├── queryClient.ts          # React Query client
│   │   └── apiClient.ts            # Base API client
│   │
│   └── types/
│       ├── dashboard.types.ts
│       ├── facilities.types.ts
│       ├── operations.types.ts
│       └── common.types.ts
│
├── hooks/                          # Custom React hooks
│   ├── dashboard/
│   │   ├── useDashboardData.ts
│   │   ├── useBuildingSummary.ts
│   │   └── useRecentActivity.ts
│   │
│   ├── facilities/
│   │   ├── useBuildings.ts
│   │   ├── useFloors.ts
│   │   ├── useRooms.ts
│   │   ├── useRoom.ts
│   │   ├── useRoomMutations.ts
│   │   └── useFloorPlan.ts
│   │
│   ├── operations/
│   │   ├── useIssues.ts
│   │   ├── useIssue.ts
│   │   ├── useIssueMutations.ts
│   │   ├── useMaintenanceSchedule.ts
│   │   ├── useKeyRequests.ts
│   │   └── useSupplyRequests.ts
│   │
│   └── common/
│       ├── useAuth.ts
│       ├── usePermissions.ts
│       ├── useFilters.ts
│       └── usePagination.ts
│
├── lib/                            # Utility libraries
│   ├── supabase.ts                 # Supabase client setup
│   ├── queryClient.ts              # React Query setup
│   ├── utils.ts                    # Utility functions
│   └── constants.ts                # App constants
│
├── types/                          # TypeScript types
│   ├── database.types.ts           # Database types (generated)
│   ├── api.types.ts                # API types
│   └── app.types.ts                # App-specific types
│
└── App.tsx                         # Root app component
```

---

## 🔒 Service-Layer Enforcement

### **Architecture Rules**

#### **Rule 1: No Direct Database Access in Components**
```typescript
// ❌ BAD - Direct Supabase import in component
import { supabase } from '@/lib/supabase';

function RoomList() {
  const [rooms, setRooms] = useState([]);
  
  useEffect(() => {
    const fetchRooms = async () => {
      const { data } = await supabase.from('rooms').select('*');
      setRooms(data);
    };
    fetchRooms();
  }, []);
  
  return <div>{/* render rooms */}</div>;
}

// ✅ GOOD - Use custom hook that calls service
import { useRooms } from '@/hooks/facilities/useRooms';

function RoomList() {
  const { data: rooms, isLoading, error } = useRooms();
  
  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorMessage error={error} />;
  
  return <div>{/* render rooms */}</div>;
}
```

#### **Rule 2: All Data Access Through Services**
```typescript
// ❌ BAD - Hook directly calls Supabase
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';

export function useRooms() {
  return useQuery({
    queryKey: ['rooms'],
    queryFn: async () => {
      const { data } = await supabase.from('rooms').select('*');
      return data;
    }
  });
}

// ✅ GOOD - Hook calls service layer
import { facilitiesService } from '@/services/facilities/facilitiesService';
import { useQuery } from '@tanstack/react-query';

export function useRooms(filters?: RoomFilters) {
  return useQuery({
    queryKey: ['rooms', filters],
    queryFn: () => facilitiesService.getRooms(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

#### **Rule 3: Services Encapsulate All Business Logic**
```typescript
// src/services/facilities/facilitiesService.ts
import { supabase } from '@/services/core/supabaseClient';
import type { Room, RoomFilters, CreateRoomData } from '@/types/facilities.types';

export const facilitiesService = {
  /**
   * Get all rooms with optional filters
   */
  async getRooms(filters?: RoomFilters): Promise<Room[]> {
    let query = supabase
      .from('rooms')
      .select(`
        *,
        building:buildings(id, name),
        floor:floors(id, floor_number, name)
      `)
      .is('deleted_at', null);
    
    // Apply filters
    if (filters?.buildingId) {
      query = query.eq('building_id', filters.buildingId);
    }
    if (filters?.floorId) {
      query = query.eq('floor_id', filters.floorId);
    }
    if (filters?.type) {
      query = query.eq('room_type', filters.type);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.search) {
      query = query.or(`room_number.ilike.%${filters.search}%,room_name.ilike.%${filters.search}%`);
    }
    
    const { data, error } = await query.order('room_number');
    
    if (error) throw new Error(`Failed to fetch rooms: ${error.message}`);
    return data || [];
  },

  /**
   * Get single room by ID
   */
  async getRoomById(id: string): Promise<Room> {
    const { data, error } = await supabase
      .from('rooms')
      .select(`
        *,
        building:buildings(id, name),
        floor:floors(id, floor_number, name),
        occupants(id, first_name, last_name, title)
      `)
      .eq('id', id)
      .is('deleted_at', null)
      .single();
    
    if (error) throw new Error(`Failed to fetch room: ${error.message}`);
    if (!data) throw new Error('Room not found');
    return data;
  },

  /**
   * Create new room
   */
  async createRoom(roomData: CreateRoomData): Promise<Room> {
    const { data, error } = await supabase
      .from('rooms')
      .insert(roomData)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create room: ${error.message}`);
    return data;
  },

  /**
   * Update existing room
   */
  async updateRoom(id: string, updates: Partial<Room>): Promise<Room> {
    const { data, error } = await supabase
      .from('rooms')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to update room: ${error.message}`);
    return data;
  },

  /**
   * Soft delete room
   */
  async deleteRoom(id: string): Promise<void> {
    const { error } = await supabase
      .from('rooms')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);
    
    if (error) throw new Error(`Failed to delete room: ${error.message}`);
  },
};
```

#### **Rule 4: React Query for All Server State**
```typescript
// src/hooks/facilities/useRooms.ts
import { useQuery } from '@tanstack/react-query';
import { facilitiesService } from '@/services/facilities/facilitiesService';
import type { RoomFilters } from '@/types/facilities.types';

export function useRooms(filters?: RoomFilters) {
  return useQuery({
    queryKey: ['rooms', filters],
    queryFn: () => facilitiesService.getRooms(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
}

// src/hooks/facilities/useRoomMutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { facilitiesService } from '@/services/facilities/facilitiesService';
import { toast } from 'sonner';

export function useRoomMutations() {
  const queryClient = useQueryClient();

  const createRoom = useMutation({
    mutationFn: facilitiesService.createRoom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success('Room created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create room: ${error.message}`);
    },
  });

  const updateRoom = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Room> }) =>
      facilitiesService.updateRoom(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success('Room updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update room: ${error.message}`);
    },
  });

  const deleteRoom = useMutation({
    mutationFn: facilitiesService.deleteRoom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success('Room deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete room: ${error.message}`);
    },
  });

  return { createRoom, updateRoom, deleteRoom };
}
```

---

## 📊 Component Architecture Pattern

### **Standard Page Component Structure**

```typescript
// src/pages/Facilities.tsx
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useRooms } from '@/hooks/facilities/useRooms';
import { useBuildings } from '@/hooks/facilities/useBuildings';
import { RoomGrid } from '@/components/facilities/RoomGrid';
import { RoomFilters } from '@/components/facilities/RoomFilters';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { EmptyState } from '@/components/common/EmptyState';

export default function Facilities() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    buildingId: searchParams.get('building') || undefined,
    floorId: searchParams.get('floor') || undefined,
    type: searchParams.get('type') || undefined,
    search: searchParams.get('search') || undefined,
  });

  // Data fetching through hooks (which call services)
  const { data: rooms, isLoading, error } = useRooms(filters);
  const { data: buildings } = useBuildings();

  // Update URL when filters change
  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    setSearchParams(params);
  };

  // Loading state
  if (isLoading) {
    return <LoadingSkeleton type="grid" count={12} />;
  }

  // Error state
  if (error) {
    return <ErrorMessage error={error} onRetry={() => refetch()} />;
  }

  // Empty state
  if (!rooms || rooms.length === 0) {
    return (
      <EmptyState
        title="No facilities found"
        description="Try adjusting your filters or create a new facility"
        action={{ label: 'Create Facility', onClick: () => {} }}
      />
    );
  }

  // Success state
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Facilities</h1>
        <CreateRoomButton />
      </div>

      <RoomFilters
        filters={filters}
        buildings={buildings}
        onChange={handleFilterChange}
      />

      <RoomGrid rooms={rooms} />
    </div>
  );
}
```

---

## 🔄 Migration Strategy

### **Phase 1: Create New Routes (Week 1)**
1. Create new route components (Dashboard, Facilities, FacilityDetail, Operations)
2. Set up service layer for each route
3. Create custom hooks for each route
4. Implement basic functionality

### **Phase 2: Migrate Existing Features (Week 2)**
1. Migrate AdminDashboard → Dashboard
2. Migrate Spaces → Facilities
3. Create FacilityDetail (new)
4. Migrate Operations (consolidate Issues, Maintenance)

### **Phase 3: Refactor Components (Week 3)**
1. Extract reusable components
2. Standardize loading/error/empty states
3. Implement consistent filtering
4. Add pagination where needed

### **Phase 4: Testing & Cleanup (Week 4)**
1. Test all routes
2. Remove legacy routes
3. Update navigation
4. Performance optimization
5. Documentation

---

## 🧪 Testing Requirements

### **Service Layer Tests**
```typescript
// src/services/facilities/__tests__/facilitiesService.test.ts
describe('facilitiesService', () => {
  describe('getRooms', () => {
    it('fetches all rooms without filters', async () => {
      const rooms = await facilitiesService.getRooms();
      expect(rooms).toBeInstanceOf(Array);
    });

    it('filters rooms by building', async () => {
      const rooms = await facilitiesService.getRooms({ buildingId: 'building-1' });
      expect(rooms.every(r => r.building_id === 'building-1')).toBe(true);
    });

    it('throws error on database failure', async () => {
      // Mock Supabase error
      await expect(facilitiesService.getRooms()).rejects.toThrow();
    });
  });
});
```

### **Hook Tests**
```typescript
// src/hooks/facilities/__tests__/useRooms.test.ts
describe('useRooms', () => {
  it('returns loading state initially', () => {
    const { result } = renderHook(() => useRooms());
    expect(result.current.isLoading).toBe(true);
  });

  it('returns data after successful fetch', async () => {
    const { result } = renderHook(() => useRooms());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeDefined();
  });
});
```

### **Component Tests**
```typescript
// src/pages/__tests__/Facilities.test.tsx
describe('Facilities Page', () => {
  it('renders loading state', () => {
    render(<Facilities />);
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });

  it('renders rooms after loading', async () => {
    render(<Facilities />);
    await waitFor(() => {
      expect(screen.getByText('Facilities')).toBeInTheDocument();
    });
  });

  it('does not import supabase directly', () => {
    const fileContent = fs.readFileSync('src/pages/Facilities.tsx', 'utf8');
    expect(fileContent).not.toContain('from "@/lib/supabase"');
  });
});
```

---

## 📈 Performance Targets

### **Page Load Performance**
- Initial page load: < 500ms
- Route transition: < 200ms
- Data fetch: < 300ms
- Cached data: < 50ms

### **Optimization Strategies**
1. **Code Splitting** - Lazy load routes
2. **React Query Caching** - 5-minute stale time
3. **Prefetching** - Prefetch on hover
4. **Memoization** - Memo expensive components
5. **Virtual Scrolling** - For large lists

---

## ✅ Definition of Done

- [ ] All four core routes implemented
- [ ] Service layer complete for all routes
- [ ] Custom hooks created for all data access
- [ ] Zero direct Supabase imports in pages/components
- [ ] Loading/error/empty states standardized
- [ ] Route protection working
- [ ] Tests written and passing
- [ ] Performance benchmarks met
- [ ] Documentation complete
- [ ] Code review approved
- [ ] Deployed to staging
- [ ] QA verification passed

---

## 📚 Related Documentation

- **Epic 001:** Schema Stabilization
- **QA Checklist:** `/docs/qa/ui-architecture-checklist.md`
- **Brownfield Analysis:** `/docs/BROWNFIELD_ANALYSIS.md`
- **Front-End Spec:** `/docs/front-end-spec.md`

---

**Epic Owner:** Frontend Architecture Team  
**Last Updated:** October 25, 2025  
**Next Review:** November 1, 2025
