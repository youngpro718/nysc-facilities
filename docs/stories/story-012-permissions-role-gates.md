# STORY-012: Permissions & Role Gates

**Story ID:** STORY-012  
**Epic:** [EPIC-003](../epics/epic-003-ops-module-v1.md) - Operations Module v1  
**Title:** Permissions & Role Gates  
**Status:** 📋 To Do  
**Priority:** 🔴 Critical  
**Story Points:** 5  
**Sprint:** Sprint 5, Week 1

---

## 📋 User Story

**As a** system administrator  
**I want** role-based permissions enforced throughout the application  
**So that** users can only perform actions they're authorized for

---

## 🎯 Acceptance Criteria

- [ ] Permission system checks user role before actions
- [ ] UI elements hidden/disabled based on permissions
- [ ] API endpoints validate permissions server-side
- [ ] Clear error messages when permission denied
- [ ] Permission checks cached for performance
- [ ] Supports roles: Admin, Manager, Facilities Staff, Staff, User
- [ ] Permissions defined in central configuration
- [ ] Permission checks work offline (cached)
- [ ] Audit log records permission denials

---

## 💻 Implementation

### Permission Configuration
```typescript
// src/lib/permissions.ts
export const PERMISSIONS = {
  // Facility permissions
  'facility.view': ['admin', 'manager', 'facilities_staff', 'staff'],
  'facility.update_status': ['admin', 'manager', 'facilities_staff'],
  'facility.edit': ['admin', 'manager'],
  'facility.delete': ['admin'],
  
  // Issue permissions
  'issue.view': ['admin', 'manager', 'facilities_staff', 'staff'],
  'issue.create': ['admin', 'manager', 'facilities_staff', 'staff'],
  'issue.assign': ['admin', 'manager'],
  'issue.resolve': ['admin', 'manager', 'facilities_staff'],
  
  // Audit trail permissions
  'audit.view': ['admin', 'manager', 'facilities_staff'],
} as const;

export function hasPermission(userRole: string, permission: keyof typeof PERMISSIONS): boolean {
  const allowedRoles = PERMISSIONS[permission];
  return allowedRoles.includes(userRole as any);
}
```

### Permission Hook
```typescript
// src/hooks/common/usePermissions.ts
import { useAuth } from '@/hooks/useAuth';
import { hasPermission } from '@/lib/permissions';

export function usePermissions() {
  const { user } = useAuth();
  
  const can = (permission: string) => {
    if (\!user) return false;
    return hasPermission(user.role, permission);
  };
  
  const canAny = (permissions: string[]) => {
    return permissions.some(permission => can(permission));
  };
  
  const canAll = (permissions: string[]) => {
    return permissions.every(permission => can(permission));
  };
  
  return { can, canAny, canAll, role: user?.role };
}
```

### Permission Gate Component
```typescript
// src/components/common/PermissionGate.tsx
import { usePermissions } from '@/hooks/common/usePermissions';

interface PermissionGateProps {
  permission: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function PermissionGate({ permission, fallback, children }: PermissionGateProps) {
  const { can } = usePermissions();
  
  if (\!can(permission)) {
    return fallback || null;
  }
  
  return <>{children}</>;
}
```

### Usage Example
```typescript
// In RoomDetailPanel
import { PermissionGate } from '@/components/common/PermissionGate';
import { usePermissions } from '@/hooks/common/usePermissions';

export function RoomDetailPanel() {
  const { can } = usePermissions();
  
  return (
    <div>
      {/* Button only visible if user has permission */}
      <PermissionGate permission="facility.update_status">
        <Button onClick={handleUpdateStatus}>Update Status</Button>
      </PermissionGate>
      
      {/* Button disabled if no permission */}
      <Button 
        onClick={handleEdit}
        disabled={\!can('facility.edit')}
      >
        Edit
      </Button>
    </div>
  );
}
```

### Server-Side Validation
```typescript
// src/services/operations/operationsService.ts
async updateRoomStatus(roomId: string, status: string): Promise<any> {
  // Check permission server-side via RLS policies
  try {
    const { data, error } = await db
      .from('rooms')
      .update({ status })
      .eq('id', roomId)
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST301') {
        throw new Error('Permission denied: You do not have access to update this room');
      }
      handleSupabaseError(error, 'Failed to update room status');
    }
    
    return data;
  } catch (error) {
    console.error('[operationsService.updateRoomStatus]:', error);
    throw error;
  }
}
```

---

## 🧪 Testing

```typescript
describe('Permissions', () => {
  it('allows admin to update status', () => {
    const { can } = renderHook(() => usePermissions(), {
      wrapper: ({ children }) => (
        <AuthProvider user={{ role: 'admin' }}>
          {children}
        </AuthProvider>
      ),
    }).result.current;
    
    expect(can('facility.update_status')).toBe(true);
  });
  
  it('denies staff from updating status', () => {
    const { can } = renderHook(() => usePermissions(), {
      wrapper: ({ children }) => (
        <AuthProvider user={{ role: 'staff' }}>
          {children}
        </AuthProvider>
      ),
    }).result.current;
    
    expect(can('facility.update_status')).toBe(false);
  });
});
```

---

## ✅ Definition of Done

- [ ] Permission configuration defined
- [ ] Permission hook created
- [ ] PermissionGate component created
- [ ] UI elements respect permissions
- [ ] Server-side validation implemented
- [ ] Permission caching working
- [ ] Clear error messages
- [ ] Tests passing (all roles)
- [ ] Documentation updated

---

**Story Owner:** Full Stack Team  
**Created:** October 25, 2025
