# STORY-011: Audit Trail Record

**Story ID:** STORY-011  
**Epic:** [EPIC-003](../epics/epic-003-ops-module-v1.md) - Operations Module v1  
**Title:** Audit Trail Record  
**Status:** 📋 To Do  
**Priority:** 🔴 Critical  
**Story Points:** 5  
**Sprint:** Sprint 6, Week 1

---

## 📋 User Story

**As a** facilities manager  
**I want** to see a complete history of all changes to a facility  
**So that** I can track who made changes and when

---

## 🎯 Acceptance Criteria

- [ ] Audit trail displays in History tab of room detail panel
- [ ] Shows all changes in reverse chronological order
- [ ] Displays user who made the change
- [ ] Shows timestamp of change
- [ ] Displays what changed (old value → new value)
- [ ] Includes notes/context if provided
- [ ] Supports pagination (20 entries per page)
- [ ] Loading state while fetching
- [ ] Empty state when no history exists
- [ ] Automatically records all status updates
- [ ] Records all room edits
- [ ] Admin-only access to full audit trail

---

## 🎨 Design

### Audit Trail Display
```
History Tab
───────────────────────────────────────
Oct 25, 2025 2:30 PM
John Doe (Facilities Staff)
Status: Available → Maintenance
"Scheduled maintenance for HVAC system"
───────────────────────────────────────
Oct 24, 2025 10:15 AM
Jane Smith (Admin)
Capacity: 4 → 6
"Added two additional desks"
───────────────────────────────────────
[Load More]
```

---

## 💻 Implementation

### Component
```typescript
// src/components/operations/AuditTrail.tsx
import { useAuditTrail } from '@/hooks/operations/useAuditTrail';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { format } from 'date-fns';

interface AuditTrailProps {
  tableName: string;
  recordId: string;
}

export function AuditTrail({ tableName, recordId }: AuditTrailProps) {
  const { data: entries, isLoading, error } = useAuditTrail(tableName, recordId);

  if (isLoading) return <LoadingSkeleton type="list" count={5} />;
  if (error) return <ErrorMessage error={error} />;
  if (\!entries || entries.length === 0) {
    return <EmptyState title="No history available" description="Changes will appear here" />;
  }

  return (
    <div className="space-y-4">
      {entries.map((entry) => (
        <div key={entry.id} className="border-l-2 border-muted pl-4 pb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">
              {format(new Date(entry.created_at), 'MMM dd, yyyy h:mm a')}
            </span>
          </div>
          <div className="text-sm text-muted-foreground mb-2">
            {entry.user_email} ({entry.user_role})
          </div>
          <div className="space-y-1">
            {entry.changed_fields?.map((field) => (
              <div key={field} className="text-sm">
                <span className="font-medium">{field}:</span>{' '}
                <span className="text-muted-foreground">
                  {entry.old_values?.[field]} → {entry.new_values?.[field]}
                </span>
              </div>
            ))}
          </div>
          {entry.action_description && (
            <div className="mt-2 text-sm italic text-muted-foreground">
              "{entry.action_description}"
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

### Service Method
```typescript
// src/services/operations/operationsService.ts (add method)
async getAuditTrail(tableName: string, recordId: string, limit: number = 20): Promise<any[]> {
  try {
    const { data, error } = await db
      .from('audit_logs')
      .select('*')
      .eq('table_name', tableName)
      .eq('record_id', recordId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) handleSupabaseError(error, 'Failed to fetch audit trail');
    return data || [];
  } catch (error) {
    console.error('[operationsService.getAuditTrail]:', error);
    throw error;
  }
}
```

### Custom Hook
```typescript
// src/hooks/operations/useAuditTrail.ts
import { useQuery } from '@tanstack/react-query';
import { operationsService } from '@/services/operations/operationsService';

export function useAuditTrail(tableName: string, recordId: string) {
  return useQuery({
    queryKey: ['audit-trail', tableName, recordId],
    queryFn: () => operationsService.getAuditTrail(tableName, recordId),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
```

---

## ✅ Definition of Done

- [ ] Component displays audit trail
- [ ] Service method implemented
- [ ] Hook created
- [ ] Pagination working
- [ ] Loading/empty/error states
- [ ] Automatic recording on updates
- [ ] Permission checks
- [ ] Tests passing
- [ ] Code review approved

---

**Story Owner:** Backend + Frontend Team  
**Created:** October 25, 2025
