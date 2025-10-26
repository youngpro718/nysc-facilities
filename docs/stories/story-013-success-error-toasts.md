# STORY-013: Success/Error Toasts

**Story ID:** STORY-013  
**Epic:** [EPIC-003](../epics/epic-003-ops-module-v1.md) - Operations Module v1  
**Title:** Success/Error Toasts  
**Status:** 📋 To Do  
**Priority:** 🟡 High  
**Story Points:** 2  
**Sprint:** Sprint 5, Week 1

---

## 📋 User Story

**As a** user  
**I want** clear feedback when I perform actions  
**So that** I know if my action succeeded or failed

---

## 🎯 Acceptance Criteria

- [ ] Toast notifications appear for all user actions
- [ ] Success toasts are green with checkmark icon
- [ ] Error toasts are red with X icon
- [ ] Info toasts are blue with info icon
- [ ] Warning toasts are yellow with warning icon
- [ ] Toasts auto-dismiss after 5 seconds (success) or 10 seconds (error)
- [ ] Toasts can be manually dismissed
- [ ] Multiple toasts stack vertically
- [ ] Toasts are accessible (screen reader support)
- [ ] Toasts don't block UI interaction
- [ ] Toast position: bottom-right on desktop, top-center on mobile

---

## 🎨 Design

### Toast Types
```
┌────────────────────────────────┐
│ ✓ Status updated successfully  │  ← Success (green)
└────────────────────────────────┘

┌────────────────────────────────┐
│ ✗ Failed to update status      │  ← Error (red)
└────────────────────────────────┘

┌────────────────────────────────┐
│ ℹ Processing your request...   │  ← Info (blue)
└────────────────────────────────┘

┌────────────────────────────────┐
│ ⚠ This action cannot be undone │  ← Warning (yellow)
└────────────────────────────────┘
```

---

## 💻 Implementation

### Toast Library
Using **Sonner** (already installed):
```bash
npm install sonner
```

### Setup
```typescript
// src/App.tsx
import { Toaster } from 'sonner';

function App() {
  return (
    <>
      {/* Your app content */}
      <Toaster 
        position="bottom-right"
        toastOptions={{
          duration: 5000,
          style: {
            background: 'hsl(var(--background))',
            color: 'hsl(var(--foreground))',
            border: '1px solid hsl(var(--border))',
          },
        }}
      />
    </>
  );
}
```

### Usage Examples
```typescript
import { toast } from 'sonner';

// Success toast
toast.success('Status updated successfully');

// Error toast
toast.error('Failed to update status: Permission denied');

// Info toast
toast.info('Processing your request...');

// Warning toast
toast.warning('This action cannot be undone');

// Custom toast with action
toast.success('Room created', {
  action: {
    label: 'View',
    onClick: () => navigate(`/facilities/${roomId}`),
  },
});

// Promise toast (shows loading, then success/error)
toast.promise(
  updateRoomStatus(roomId, status),
  {
    loading: 'Updating status...',
    success: 'Status updated successfully',
    error: 'Failed to update status',
  }
);
```

### Integration with Mutations
```typescript
// src/hooks/operations/useStatusUpdate.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { operationsService } from '@/services/operations/operationsService';
import { toast } from 'sonner';

export function useStatusUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roomId, status, notes }: UpdateStatusParams) =>
      operationsService.updateRoomStatus(roomId, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success('Status updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update status: ${error.message}`);
    },
  });
}
```

### Custom Toast Component (if needed)
```typescript
// src/components/common/CustomToast.tsx
import { toast as sonnerToast } from 'sonner';

export const toast = {
  success: (message: string, options?: any) => {
    sonnerToast.success(message, {
      ...options,
      duration: 5000,
    });
  },
  
  error: (message: string, options?: any) => {
    sonnerToast.error(message, {
      ...options,
      duration: 10000, // Longer for errors
    });
  },
  
  info: (message: string, options?: any) => {
    sonnerToast.info(message, {
      ...options,
      duration: 5000,
    });
  },
  
  warning: (message: string, options?: any) => {
    sonnerToast.warning(message, {
      ...options,
      duration: 7000,
    });
  },
  
  promise: sonnerToast.promise,
};
```

---

## 🧪 Testing

```typescript
describe('Toast Notifications', () => {
  it('shows success toast on successful update', async () => {
    render(<StatusUpdateModal />);
    
    fireEvent.click(screen.getByText('Update Status'));
    
    await waitFor(() => {
      expect(screen.getByText('Status updated successfully')).toBeInTheDocument();
    });
  });
  
  it('shows error toast on failed update', async () => {
    // Mock API failure
    render(<StatusUpdateModal />);
    
    fireEvent.click(screen.getByText('Update Status'));
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to update status/)).toBeInTheDocument();
    });
  });
  
  it('auto-dismisses after duration', async () => {
    render(<StatusUpdateModal />);
    
    fireEvent.click(screen.getByText('Update Status'));
    
    await waitFor(() => {
      expect(screen.getByText('Status updated successfully')).toBeInTheDocument();
    });
    
    await waitFor(() => {
      expect(screen.queryByText('Status updated successfully')).not.toBeInTheDocument();
    }, { timeout: 6000 });
  });
});
```

---

## 📝 Toast Message Guidelines

### Success Messages
- ✅ "Status updated successfully"
- ✅ "Room created successfully"
- ✅ "Changes saved"
- ✅ "Issue resolved"

### Error Messages
- ❌ "Failed to update status: [reason]"
- ❌ "Permission denied"
- ❌ "Network error. Please try again"
- ❌ "Invalid input: [field] is required"

### Info Messages
- ℹ️ "Processing your request..."
- ℹ️ "Loading data..."
- ℹ️ "Changes will take effect shortly"

### Warning Messages
- ⚠️ "This action cannot be undone"
- ⚠️ "You have unsaved changes"
- ⚠️ "Session will expire in 5 minutes"

---

## ✅ Definition of Done

- [ ] Sonner library integrated
- [ ] Toaster component added to App.tsx
- [ ] All mutations show toasts
- [ ] Success/error/info/warning variants working
- [ ] Auto-dismiss timing correct
- [ ] Manual dismiss working
- [ ] Accessible (screen reader tested)
- [ ] Responsive on mobile
- [ ] Tests passing
- [ ] Documentation updated

---

**Story Owner:** Frontend Team  
**Created:** October 25, 2025
