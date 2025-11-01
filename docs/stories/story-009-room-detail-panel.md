# STORY-009: Room Detail Panel

**Story ID:** STORY-009  
**Epic:** [EPIC-003](../epics/epic-003-ops-module-v1.md) - Operations Module v1  
**Title:** Room Detail Panel  
**Status:** 📋 To Do  
**Priority:** 🔴 Critical  
**Story Points:** 5  
**Sprint:** Sprint 5, Week 1-2

---

## 📋 User Story

**As a** facilities staff member  
**I want** to view comprehensive facility details in a slide-in panel  
**So that** I can quickly access all relevant information without leaving the operations page

---

## 🎯 Acceptance Criteria

- [ ] Panel slides in from the right side of the screen
- [ ] Panel displays room number, name, and building/floor
- [ ] Panel shows current status with color-coded badge
- [ ] Panel displays capacity, type, and amenities
- [ ] Panel shows current occupants (if any)
- [ ] Panel includes action buttons (Update Status, Edit, Close)
- [ ] Panel has tabs for Info, Issues, Keys, History
- [ ] Panel is responsive on mobile (full screen on small devices)
- [ ] Panel can be closed with X button or ESC key
- [ ] Panel shows loading state while fetching data
- [ ] Panel handles errors gracefully

---

## 🎨 Design Specifications

### Panel Layout
```
┌─────────────────────────────────────────┐
│  Room 101                          [X]  │
│  Building A, Floor 1                    │
│  ─────────────────────────────────────  │
│  [Available] [Update Status] [Edit]    │
│  ─────────────────────────────────────  │
│  [Info] [Issues] [Keys] [History]      │
│  ─────────────────────────────────────  │
│                                         │
│  Room Information                       │
│  • Type: Office                         │
│  • Capacity: 4 people                   │
│  • Square Footage: 150 sq ft            │
│  • Amenities: Whiteboard, AV            │
│                                         │
│  Current Occupants                      │
│  • John Doe (Judge)                     │
│  • Jane Smith (Clerk)                   │
│                                         │
└─────────────────────────────────────────┘
```

### Component Structure
```typescript
<Sheet open={isOpen} onOpenChange={setIsOpen}>
  <SheetContent side="right" className="w-full sm:max-w-xl">
    <SheetHeader>
      <SheetTitle>{room.room_number} - {room.room_name}</SheetTitle>
      <SheetDescription>
        {building.name}, Floor {floor.floor_number}
      </SheetDescription>
    </SheetHeader>
    
    <div className="space-y-4">
      {/* Status Badge */}
      <StatusBadge status={room.status} />
      
      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button onClick={handleUpdateStatus}>Update Status</Button>
        <Button variant="outline" onClick={handleEdit}>Edit</Button>
      </div>
      
      {/* Tabs */}
      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Info</TabsTrigger>
          <TabsTrigger value="issues">Issues</TabsTrigger>
          <TabsTrigger value="keys">Keys</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="info">
          <RoomInformation room={room} />
        </TabsContent>
        
        <TabsContent value="issues">
          <RoomIssues roomId={room.id} />
        </TabsContent>
        
        <TabsContent value="keys">
          <RoomKeys roomId={room.id} />
        </TabsContent>
        
        <TabsContent value="history">
          <AuditTrail recordId={room.id} />
        </TabsContent>
      </Tabs>
    </div>
  </SheetContent>
</Sheet>
```

---

## 💻 Implementation Details

### Component File
```typescript
// src/components/operations/RoomDetailPanel.tsx
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useFacilityDetails } from '@/hooks/facilities/useFacilityDetails';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { ErrorMessage } from '@/components/common/ErrorMessage';

interface RoomDetailPanelProps {
  roomId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus?: () => void;
}

export function RoomDetailPanel({ 
  roomId, 
  isOpen, 
  onClose,
  onUpdateStatus 
}: RoomDetailPanelProps) {
  const { data: room, isLoading, error } = useFacilityDetails(roomId);

  if (!roomId) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        {isLoading && <LoadingSkeleton type="card" count={3} />}
        
        {error && <ErrorMessage error={error} />}
        
        {room && (
          <>
            <SheetHeader>
              <SheetTitle>
                {room.room_number} {room.room_name && `- ${room.room_name}`}
              </SheetTitle>
              <SheetDescription>
                {room.building?.name}, Floor {room.floor?.floor_number}
              </SheetDescription>
            </SheetHeader>
            
            <div className="space-y-6 mt-6">
              {/* Status Badge */}
              <StatusBadge status={room.status} />
              
              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button onClick={onUpdateStatus}>
                  Update Status
                </Button>
                <Button variant="outline">
                  Edit Details
                </Button>
              </div>
              
              {/* Tabs */}
              <Tabs defaultValue="info">
                <TabsList className="w-full">
                  <TabsTrigger value="info" className="flex-1">Info</TabsTrigger>
                  <TabsTrigger value="issues" className="flex-1">Issues</TabsTrigger>
                  <TabsTrigger value="keys" className="flex-1">Keys</TabsTrigger>
                  <TabsTrigger value="history" className="flex-1">History</TabsTrigger>
                </TabsList>
                
                <TabsContent value="info" className="space-y-4">
                  <RoomInformation room={room} />
                </TabsContent>
                
                <TabsContent value="issues">
                  <RoomIssues roomId={room.id} />
                </TabsContent>
                
                <TabsContent value="keys">
                  <RoomKeys roomId={room.id} />
                </TabsContent>
                
                <TabsContent value="history">
                  <AuditTrail 
                    tableName="rooms" 
                    recordId={room.id} 
                  />
                </TabsContent>
              </Tabs>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
```

### Room Information Component
```typescript
// src/components/operations/RoomInformation.tsx
interface RoomInformationProps {
  room: Room;
}

export function RoomInformation({ room }: RoomInformationProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-3">Room Details</h3>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm text-muted-foreground">Type</dt>
            <dd className="font-medium">{room.room_type}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Capacity</dt>
            <dd className="font-medium">{room.capacity} people</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Square Footage</dt>
            <dd className="font-medium">{room.square_footage} sq ft</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Status</dt>
            <dd className="font-medium">{room.operational_status}</dd>
          </div>
        </dl>
      </div>
      
      {room.amenities && room.amenities.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3">Amenities</h3>
          <div className="flex flex-wrap gap-2">
            {room.amenities.map((amenity, i) => (
              <span key={i} className="px-2 py-1 bg-muted rounded text-sm">
                {amenity}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {room.occupants && room.occupants.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3">Current Occupants</h3>
          <ul className="space-y-2">
            {room.occupants.map((occupant) => (
              <li key={occupant.id} className="flex items-center gap-2">
                <span className="font-medium">
                  {occupant.first_name} {occupant.last_name}
                </span>
                {occupant.title && (
                  <span className="text-sm text-muted-foreground">
                    ({occupant.title})
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

---

## 🔌 Service Layer

Uses existing `facilitiesService.getRoomById(id)` from EPIC-002.

---

## 🪝 Custom Hook

```typescript
// src/hooks/facilities/useFacilityDetails.ts
import { useQuery } from '@tanstack/react-query';
import { facilitiesService } from '@/services/facilities/facilitiesService';

export function useFacilityDetails(roomId: string | null) {
  return useQuery({
    queryKey: ['facility-details', roomId],
    queryFn: () => facilitiesService.getRoomById(roomId!),
    enabled: !!roomId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

---

## 🧪 Testing

### Unit Tests
```typescript
describe('RoomDetailPanel', () => {
  it('renders loading state', () => {
    render(<RoomDetailPanel roomId="123" isOpen={true} onClose={() => {}} />);
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });

  it('displays room information', async () => {
    render(<RoomDetailPanel roomId="123" isOpen={true} onClose={() => {}} />);
    await waitFor(() => {
      expect(screen.getByText('Room 101')).toBeInTheDocument();
    });
  });

  it('closes on ESC key', () => {
    const onClose = jest.fn();
    render(<RoomDetailPanel roomId="123" isOpen={true} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
```

---

## ✅ Definition of Done

- [ ] Component created and styled
- [ ] All tabs implemented (Info, Issues, Keys, History)
- [ ] Loading and error states handled
- [ ] Responsive design tested
- [ ] Keyboard navigation works (ESC to close)
- [ ] Unit tests written and passing
- [ ] Integration with Operations page
- [ ] Code review approved
- [ ] QA tested on desktop and mobile
- [ ] Documentation updated

---

**Story Owner:** Frontend Team  
**Created:** October 25, 2025
