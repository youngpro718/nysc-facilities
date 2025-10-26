# STORY-010: Status Update Action

**Story ID:** STORY-010  
**Epic:** [EPIC-003](../epics/epic-003-ops-module-v1.md) - Operations Module v1  
**Title:** Status Update Action  
**Status:** 📋 To Do  
**Priority:** 🔴 Critical  
**Story Points:** 3  
**Sprint:** Sprint 5, Week 2

---

## 📋 User Story

**As a** facilities staff member  
**I want** to quickly update the status of a facility  
**So that** I can keep facility information current and accurate

---

## 🎯 Acceptance Criteria

- [ ] "Update Status" button visible in room detail panel
- [ ] Button disabled if user lacks permission (STORY-012)
- [ ] Modal opens with current status pre-selected
- [ ] Status dropdown shows all valid statuses
- [ ] Notes field allows adding context (optional)
- [ ] Validation prevents invalid status transitions
- [ ] Optimistic update shows immediate feedback
- [ ] Success toast appears on save (STORY-013)
- [ ] Error toast appears on failure (STORY-013)
- [ ] Audit trail records the change (STORY-011)
- [ ] Panel refreshes with updated data

---

## 🎨 Design Specifications

### Status Update Modal
```
┌─────────────────────────────────────┐
│  Update Room Status            [X]  │
│  ───────────────────────────────────│
│                                     │
│  Current Status: Available          │
│                                     │
│  New Status *                       │
│  [Dropdown: Select status ▼]        │
│                                     │
│  Notes (optional)                   │
│  ┌─────────────────────────────┐   │
│  │ Add context for this change │   │
│  │                             │   │
│  └─────────────────────────────┘   │
│                                     │
│  [Cancel]  [Update Status]          │
└─────────────────────────────────────┘
```

### Status Options
- **Available** - Room is ready for use
- **Occupied** - Room is currently in use
- **Maintenance** - Room under maintenance
- **Reserved** - Room is reserved
- **Closed** - Room is closed/unavailable
- **Under Construction** - Room being renovated

---

## 💻 Implementation

### Component
```typescript
// src/components/operations/StatusUpdateModal.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useStatusUpdate } from '@/hooks/operations/useStatusUpdate';
import { toast } from 'sonner';

interface StatusUpdateModalProps {
  roomId: string;
  currentStatus: string;
  isOpen: boolean;
  onClose: () => void;
}

export function StatusUpdateModal({ 
  roomId, 
  currentStatus, 
  isOpen, 
  onClose 
}: StatusUpdateModalProps) {
  const [newStatus, setNewStatus] = useState(currentStatus);
  const [notes, setNotes] = useState('');
  
  const { mutate: updateStatus, isLoading } = useStatusUpdate();

  const handleSubmit = () => {
    if (newStatus === currentStatus) {
      toast.info('Status unchanged');
      return;
    }

    updateStatus(
      { roomId, status: newStatus, notes },
      {
        onSuccess: () => {
          toast.success('Status updated successfully');
          onClose();
        },
        onError: (error) => {
          toast.error(`Failed to update status: ${error.message}`);
        },
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Room Status</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Current Status: <span className="font-medium">{currentStatus}</span>
            </p>
          </div>
          
          <div>
            <label className="text-sm font-medium">New Status *</label>
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="occupied">Occupied</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="reserved">Reserved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="under_construction">Under Construction</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium">Notes (optional)</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add context for this status change..."
              rows={3}
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update Status'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 🔌 Service Layer

```typescript
// src/services/operations/operationsService.ts (add method)
/**
 * Update room status
 * @param roomId - Room ID
 * @param status - New status
 * @param notes - Optional notes
 * @returns Promise<Room>
 */
async updateRoomStatus(
  roomId: string, 
  status: string, 
  notes?: string
): Promise<any> {
  try {
    const { data, error } = await db
      .from('rooms')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', roomId)
      .select()
      .single();

    if (error) handleSupabaseError(error, 'Failed to update room status');

    // Create audit log entry
    await db.from('audit_logs').insert({
      table_name: 'rooms',
      record_id: roomId,
      operation: 'UPDATE',
      old_values: { status: data.status },
      new_values: { status },
      action_description: notes || `Status changed to ${status}`,
      user_id: (await db.auth.getUser()).data.user?.id,
    });

    return validateData(data, 'Failed to update room status');
  } catch (error) {
    console.error('[operationsService.updateRoomStatus]:', error);
    throw error;
  }
}
```

---

## 🪝 Custom Hook

```typescript
// src/hooks/operations/useStatusUpdate.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { operationsService } from '@/services/operations/operationsService';

export function useStatusUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roomId, status, notes }: { 
      roomId: string; 
      status: string; 
      notes?: string;
    }) => operationsService.updateRoomStatus(roomId, status, notes),
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['facility-details', variables.roomId] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['audit-trail', variables.roomId] });
    },
  });
}
```

---

## 🧪 Testing

```typescript
describe('StatusUpdateModal', () => {
  it('displays current status', () => {
    render(<StatusUpdateModal roomId="123" currentStatus="available" isOpen={true} onClose={() => {}} />);
    expect(screen.getByText('Current Status: available')).toBeInTheDocument();
  });

  it('updates status successfully', async () => {
    const onClose = jest.fn();
    render(<StatusUpdateModal roomId="123" currentStatus="available" isOpen={true} onClose={onClose} />);
    
    // Select new status
    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(screen.getByText('Maintenance'));
    
    // Submit
    fireEvent.click(screen.getByText('Update Status'));
    
    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
      expect(screen.getByText('Status updated successfully')).toBeInTheDocument();
    });
  });

  it('shows error on failure', async () => {
    // Mock API failure
    render(<StatusUpdateModal roomId="123" currentStatus="available" isOpen={true} onClose={() => {}} />);
    
    fireEvent.click(screen.getByText('Update Status'));
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to update status/)).toBeInTheDocument();
    });
  });
});
```

---

## ✅ Definition of Done

- [ ] Modal component created
- [ ] Status dropdown populated
- [ ] Notes field functional
- [ ] Service method implemented
- [ ] Hook created with React Query
- [ ] Optimistic updates working
- [ ] Toast notifications integrated
- [ ] Audit trail recording
- [ ] Permission checks integrated
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Code review approved
- [ ] QA tested

---

**Story Owner:** Frontend Team  
**Created:** October 25, 2025
