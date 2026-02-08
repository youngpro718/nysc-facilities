/**
 * useRoomStatusUpdate Hook
 * 
 * Custom hook for updating room status with RBAC and audit logging
 * 
 * @module hooks/operations/useRoomStatusUpdate
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { operationsService } from '@/services/operations/operationsService';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/common/usePermissions';
import { toast } from 'sonner';

interface UpdateRoomStatusParams {
  roomId: string;
  newStatus: string;
  notes?: string;
}

export function useRoomStatusUpdate() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { can } = usePermissions();

  return useMutation({
    mutationFn: async ({ roomId, newStatus, notes }: UpdateRoomStatusParams) => {
      // Check permission before making API call
      if (!can('facility.update_status')) {
        throw new Error('Permission denied: You do not have permission to update room status');
      }

      // Call service with user ID for audit trail
      return operationsService.updateRoomStatus(
        roomId,
        newStatus,
        notes,
        user?.id
      );
    },
    onMutate: async ({ roomId, newStatus }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['facility-details', roomId] });

      // Snapshot previous value
      const previousRoom = queryClient.getQueryData(['facility-details', roomId]);

      // Optimistically update
      queryClient.setQueryData(['facility-details', roomId], (old: Record<string, unknown>) => {
        if (!old) return old;
        return {
          ...old,
          status: newStatus,
          updated_at: new Date().toISOString(),
        };
      });

      return { previousRoom };
    },
    onError: (error: Error, variables, context) => {
      // Rollback on error
      if (context?.previousRoom) {
        queryClient.setQueryData(
          ['facility-details', variables.roomId],
          context.previousRoom
        );
      }
      
      toast.error(`Failed to update status: ${error.message}`);
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ['facility-details', variables.roomId] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['audit-trail', 'rooms', variables.roomId] });
      
      toast.success('Status updated successfully');
    },
  });
}
