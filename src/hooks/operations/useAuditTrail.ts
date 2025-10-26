/**
 * useAuditTrail Hook
 * 
 * Custom hook for fetching audit trail with RBAC
 * 
 * @module hooks/operations/useAuditTrail
 */

import { useQuery } from '@tanstack/react-query';
import { operationsService } from '@/services/operations/operationsService';
import { usePermissions } from '@/hooks/common/usePermissions';

export function useAuditTrail(tableName: string, recordId: string, limit: number = 20) {
  const { can } = usePermissions();

  return useQuery({
    queryKey: ['audit-trail', tableName, recordId, limit],
    queryFn: () => {
      // Check permission before fetching
      if (!can('audit.view')) {
        throw new Error('Permission denied: You do not have permission to view audit trail');
      }
      
      return operationsService.getAuditTrail(tableName, recordId, limit);
    },
    enabled: can('audit.view'), // Only fetch if user has permission
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1,
  });
}
