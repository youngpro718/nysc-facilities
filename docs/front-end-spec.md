# Front-End Specification

## NYSC Facilities Management System

**Version:** 2.0.0  
**Last Updated:** October 25, 2025  
**Status:** Active Development

---

## 📚 Overview

This document defines the front-end architecture, routing structure, and development patterns for the NYSC Facilities Management System. All front-end development must follow these specifications to ensure consistency, maintainability, and performance.

**Related Documentation:**
- **Epic 002:** [UI Architecture & Route Standardization](./epics/epic-002-ui-architecture.md)
- **QA Checklist:** [UI Architecture Verification](./qa/ui-architecture-checklist.md)
- **Brownfield Analysis:** [Current State Analysis](./BROWNFIELD_ANALYSIS.md)

---

## 🗺️ Route Architecture

### **Core Routes**

The application is organized around four primary routes:

#### **1. Dashboard (`/`)**
- **Purpose:** Central hub with system overview
- **Access:** Admin users (default), Regular users (`/dashboard`)
- **Features:** Stats, building overview, recent activity, quick actions
- **Component:** `src/pages/Dashboard.tsx`

#### **2. Facilities (`/facilities`)**
- **Purpose:** Comprehensive facility management
- **Access:** Admin users with `spaces` module enabled
- **Features:** Room grid/list/map views, filtering, CRUD operations
- **Component:** `src/pages/Facilities.tsx`

#### **3. Facility Detail (`/facilities/:id`)**
- **Purpose:** Detailed view of single facility
- **Access:** Admin users with `spaces` module enabled
- **Features:** Room info, issues, keys, history, 3D view
- **Component:** `src/pages/FacilityDetail.tsx`

#### **4. Operations (`/ops`)**
- **Purpose:** Unified operations hub
- **Access:** Admin users with `operations` module enabled
- **Features:** Issues, maintenance, key requests, supply requests
- **Component:** `src/pages/Operations.tsx`

### **URL Patterns**

```
# Dashboard
/                           # Admin dashboard
/dashboard                  # User dashboard

# Facilities
/facilities                 # Facilities list
/facilities?building=:id    # Filter by building
/facilities?floor=:id       # Filter by floor
/facilities?type=:type      # Filter by room type
/facilities?view=grid       # View mode (grid/list/map)

# Facility Detail
/facilities/:id             # Facility detail
/facilities/:id?tab=info    # Tab selection

# Operations
/ops                        # Operations hub
/ops?tab=issues             # Tab selection
/ops?status=open            # Filter by status
/ops?priority=high          # Filter by priority
```

---

## 🏗️ Architecture Patterns

### **Service-Layer Architecture**

All data access MUST go through the service layer. Direct database access from components is prohibited.

```
┌─────────────────────────────────────────────────┐
│              Component Layer                     │
│  (Pages, Components - NO data access)           │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│              Hook Layer                          │
│  (Custom hooks with React Query)                │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│              Service Layer                       │
│  (Business logic, Supabase access)              │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│              Database Layer                      │
│  (Supabase PostgreSQL)                          │
└─────────────────────────────────────────────────┘
```

### **Data Flow Pattern**

```typescript
// ❌ PROHIBITED - Direct database access in component
import { supabase } from '@/lib/supabase';

function RoomList() {
  const [rooms, setRooms] = useState([]);
  useEffect(() => {
    supabase.from('rooms').select('*').then(({ data }) => setRooms(data));
  }, []);
  return <div>{/* render */}</div>;
}

// ✅ REQUIRED - Service layer pattern
// 1. Service (src/services/facilities/facilitiesService.ts)
export const facilitiesService = {
  async getRooms(filters?: RoomFilters): Promise<Room[]> {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .is('deleted_at', null);
    if (error) throw new Error(error.message);
    return data || [];
  }
};

// 2. Hook (src/hooks/facilities/useRooms.ts)
export function useRooms(filters?: RoomFilters) {
  return useQuery({
    queryKey: ['rooms', filters],
    queryFn: () => facilitiesService.getRooms(filters),
    staleTime: 5 * 60 * 1000,
  });
}

// 3. Component (src/pages/Facilities.tsx)
function RoomList() {
  const { data: rooms, isLoading, error } = useRooms();
  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorMessage error={error} />;
  return <div>{/* render rooms */}</div>;
}
```

---

## 📁 File Structure

### **Directory Organization**

```
src/
├── pages/                  # Route pages (thin, presentational)
│   ├── Dashboard.tsx
│   ├── Facilities.tsx
│   ├── FacilityDetail.tsx
│   └── Operations.tsx
│
├── components/             # Reusable UI components
│   ├── dashboard/
│   ├── facilities/
│   ├── operations/
│   ├── common/
│   └── ui/
│
├── services/               # Service layer (ONLY place for Supabase)
│   ├── dashboard/
│   ├── facilities/
│   ├── operations/
│   └── core/
│       └── supabaseClient.ts  # ONLY Supabase import
│
├── hooks/                  # Custom React hooks
│   ├── dashboard/
│   ├── facilities/
│   ├── operations/
│   └── common/
│
├── types/                  # TypeScript types
│   ├── database.types.ts
│   ├── api.types.ts
│   └── app.types.ts
│
└── lib/                    # Utility libraries
    ├── supabase.ts
    ├── queryClient.ts
    └── utils.ts
```

### **Naming Conventions**

- **Pages:** PascalCase, descriptive (e.g., `Dashboard.tsx`, `FacilityDetail.tsx`)
- **Components:** PascalCase, noun-based (e.g., `RoomCard.tsx`, `IssueList.tsx`)
- **Services:** camelCase, ends with Service (e.g., `facilitiesService.ts`)
- **Hooks:** camelCase, starts with `use` (e.g., `useRooms.ts`, `useIssues.ts`)
- **Types:** PascalCase for interfaces/types (e.g., `Room`, `Issue`, `RoomFilters`)

---

## 🎨 Component Standards

### **Component Structure**

Every component must follow this structure:

```typescript
// 1. Imports (grouped)
import { useState } from 'react';
import { useRooms } from '@/hooks/facilities/useRooms';
import { RoomCard } from '@/components/facilities/RoomCard';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import type { Room } from '@/types/facilities.types';

// 2. Type definitions
interface RoomListProps {
  buildingId?: string;
  onRoomClick?: (room: Room) => void;
}

// 3. Component
export function RoomList({ buildingId, onRoomClick }: RoomListProps) {
  // 3a. Hooks
  const { data: rooms, isLoading, error } = useRooms({ buildingId });
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  // 3b. Event handlers
  const handleRoomClick = (room: Room) => {
    setSelectedRoom(room);
    onRoomClick?.(room);
  };

  // 3c. Conditional renders
  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorMessage error={error} />;
  if (!rooms?.length) return <EmptyState />;

  // 3d. Main render
  return (
    <div className="grid grid-cols-4 gap-4">
      {rooms.map(room => (
        <RoomCard
          key={room.id}
          room={room}
          onClick={() => handleRoomClick(room)}
        />
      ))}
    </div>
  );
}
```

### **State Management Rules**

1. **Server State:** Use React Query (via custom hooks)
2. **UI State:** Use useState for local component state
3. **Global UI State:** Use Zustand or Context
4. **Form State:** Use React Hook Form
5. **URL State:** Use useSearchParams for filters/tabs

### **Loading States**

All data-fetching components must handle three states:

```typescript
function DataComponent() {
  const { data, isLoading, error } = useData();

  // 1. Loading state
  if (isLoading) {
    return <LoadingSkeleton type="grid" count={8} />;
  }

  // 2. Error state
  if (error) {
    return (
      <ErrorMessage 
        error={error} 
        onRetry={() => refetch()}
      />
    );
  }

  // 3. Empty state
  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="No data found"
        description="Try adjusting your filters"
        action={{ label: 'Reset Filters', onClick: resetFilters }}
      />
    );
  }

  // 4. Success state
  return <DataDisplay data={data} />;
}
```

---

## 🔌 Service Layer Specification

### **Service Structure**

```typescript
// src/services/facilities/facilitiesService.ts
import { supabase } from '@/services/core/supabaseClient';
import type { Room, RoomFilters, CreateRoomData } from '@/types/facilities.types';

export const facilitiesService = {
  /**
   * Get all rooms with optional filters
   * @param filters - Optional filters for rooms
   * @returns Promise<Room[]>
   */
  async getRooms(filters?: RoomFilters): Promise<Room[]> {
    let query = supabase
      .from('rooms')
      .select('*, building:buildings(*), floor:floors(*)')
      .is('deleted_at', null);
    
    if (filters?.buildingId) query = query.eq('building_id', filters.buildingId);
    if (filters?.search) query = query.ilike('room_number', `%${filters.search}%`);
    
    const { data, error } = await query.order('room_number');
    if (error) throw new Error(`Failed to fetch rooms: ${error.message}`);
    return data || [];
  },

  /**
   * Get single room by ID
   * @param id - Room ID
   * @returns Promise<Room>
   */
  async getRoomById(id: string): Promise<Room> {
    const { data, error } = await supabase
      .from('rooms')
      .select('*, building:buildings(*), floor:floors(*)')
      .eq('id', id)
      .single();
    
    if (error) throw new Error(`Failed to fetch room: ${error.message}`);
    if (!data) throw new Error('Room not found');
    return data;
  },

  /**
   * Create new room
   * @param roomData - Room data
   * @returns Promise<Room>
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
};
```

### **Service Requirements**

1. **Error Handling:** All services must throw descriptive errors
2. **Type Safety:** All parameters and returns must be typed
3. **Documentation:** JSDoc comments for all public methods
4. **Null Safety:** Handle null/undefined responses
5. **Consistent API:** Similar operations use similar patterns

---

## 🪝 Hook Specifications

### **Query Hooks**

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
```

### **Mutation Hooks**

```typescript
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
      toast.error(error.message);
    },
  });

  return { createRoom };
}
```

### **Hook Requirements**

1. **React Query:** All data fetching uses React Query
2. **Query Keys:** Structured as `[resource, ...filters]`
3. **Cache Configuration:** Appropriate staleTime and cacheTime
4. **Invalidation:** Mutations invalidate related queries
5. **Error Handling:** User-friendly error messages

---

## 🎯 Performance Standards

### **Performance Targets**

- **Initial Load:** < 500ms
- **Route Transition:** < 200ms
- **Data Fetch:** < 300ms
- **Cached Data:** < 50ms
- **Time to Interactive:** < 2s

### **Optimization Techniques**

1. **Code Splitting:** Lazy load routes
   ```typescript
   const Facilities = lazy(() => import('@/pages/Facilities'));
   ```

2. **React Query Caching:** Configure appropriate cache times
   ```typescript
   staleTime: 5 * 60 * 1000, // 5 minutes
   cacheTime: 10 * 60 * 1000, // 10 minutes
   ```

3. **Memoization:** Memo expensive components
   ```typescript
   const MemoizedRoomCard = memo(RoomCard);
   ```

4. **Virtual Scrolling:** For large lists (100+ items)
   ```typescript
   import { useVirtualizer } from '@tanstack/react-virtual';
   ```

5. **Prefetching:** Prefetch on hover
   ```typescript
   const prefetchRoom = (id: string) => {
     queryClient.prefetchQuery(['room', id], () => 
       facilitiesService.getRoomById(id)
     );
   };
   ```

---

## 🧪 Testing Requirements

### **Test Coverage Requirements**

- **Services:** 100% coverage
- **Hooks:** 90% coverage
- **Components:** 80% coverage
- **Pages:** 70% coverage

### **Test Types**

1. **Unit Tests:** Services and hooks
2. **Component Tests:** UI components
3. **Integration Tests:** Page components
4. **E2E Tests:** Critical user flows

### **Example Tests**

```typescript
// Service test
describe('facilitiesService', () => {
  it('fetches rooms successfully', async () => {
    const rooms = await facilitiesService.getRooms();
    expect(rooms).toBeInstanceOf(Array);
  });
});

// Hook test
describe('useRooms', () => {
  it('returns data after loading', async () => {
    const { result } = renderHook(() => useRooms());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeDefined();
  });
});

// Component test
describe('RoomList', () => {
  it('renders rooms', async () => {
    render(<RoomList />);
    await waitFor(() => {
      expect(screen.getByText('Room 101')).toBeInTheDocument();
    });
  });
});
```

---

## 🔒 Security Requirements

### **Authentication**

- All routes except `/login` require authentication
- Use `ProtectedRoute` wrapper for auth-required routes
- Token stored in httpOnly cookie (handled by Supabase)

### **Authorization**

- Admin routes use `requireAdmin` prop
- Module-specific routes use `ModuleProtectedRoute`
- RLS policies enforce database-level security

### **Data Validation**

- All user input validated with Zod schemas
- Form validation with React Hook Form
- API responses validated before use

---

## 📱 Responsive Design

### **Breakpoints**

```typescript
// Tailwind breakpoints
sm: '640px'   // Mobile landscape
md: '768px'   // Tablet
lg: '1024px'  // Desktop
xl: '1280px'  // Large desktop
2xl: '1536px' // Extra large
```

### **Mobile-First Approach**

```typescript
// Default: Mobile
<div className="grid grid-cols-1 gap-4">
  
// Tablet: 2 columns
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  
// Desktop: 4 columns
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
```

---

## ♿ Accessibility Standards

### **WCAG 2.1 Level AA Compliance**

1. **Keyboard Navigation:** All interactive elements accessible via keyboard
2. **Screen Readers:** Proper ARIA labels and semantic HTML
3. **Color Contrast:** Minimum 4.5:1 for normal text
4. **Focus Indicators:** Visible focus states on all interactive elements

### **Implementation**

```typescript
// Proper button with accessibility
<button
  onClick={handleClick}
  aria-label="Create new room"
  className="focus:ring-2 focus:ring-blue-500"
>
  Create Room
</button>

// Proper form field
<label htmlFor="room-number" className="sr-only">
  Room Number
</label>
<input
  id="room-number"
  type="text"
  aria-required="true"
  aria-invalid={!!errors.roomNumber}
/>
```

---

## 📊 Monitoring & Analytics

### **Error Tracking**

- All errors logged to console in development
- Production errors sent to error tracking service
- User-friendly error messages displayed

### **Performance Monitoring**

- Core Web Vitals tracked
- React Query DevTools in development
- Performance budgets enforced

---

## ✅ Code Review Checklist

Before submitting a PR, verify:

- [ ] No direct Supabase imports in components/pages
- [ ] All data access through service layer
- [ ] Custom hooks use React Query
- [ ] Loading/error/empty states implemented
- [ ] TypeScript types defined
- [ ] Tests written and passing
- [ ] Accessibility requirements met
- [ ] Responsive design implemented
- [ ] Performance targets met
- [ ] Documentation updated

---

## 📚 Additional Resources

- **React Query Docs:** https://tanstack.com/query/latest
- **Shadcn/ui Docs:** https://ui.shadcn.com
- **Tailwind CSS Docs:** https://tailwindcss.com/docs
- **Supabase Docs:** https://supabase.com/docs

---

**Last Updated:** October 25, 2025  
**Version:** 2.0.0  
**Status:** Active
