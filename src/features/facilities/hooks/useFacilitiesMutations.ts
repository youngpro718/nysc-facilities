/**
 * useFacilitiesMutations Hook
 * 
 * Custom hooks for mutating facilities data with React Query
 * 
 * @module features/facilities/hooks/useFacilitiesMutations
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { facilitiesService } from '../services/facilitiesService';
import { toast } from 'sonner';
import type { Room } from '../model';

/**
 * Create new room mutation
 */
export function useCreateRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roomData: Partial<Room>) => facilitiesService.createRoom(roomData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success('Room created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create room: ${error.message}`);
    },
  });
}

/**
 * Update room mutation
 */
export function useUpdateRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Room> }) =>
      facilitiesService.updateRoom(id, updates),
    onMutate: async ({ id, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['room', id] });

      // Snapshot previous value
      const previousRoom = queryClient.getQueryData(['room', id]);

      // Optimistically update
      queryClient.setQueryData(['room', id], (old: Record<string, unknown>) => {
        if (!old) return old;
        return { ...old, ...updates };
      });

      return { previousRoom };
    },
    onError: (error: Error, variables, context) => {
      // Rollback on error
      if (context?.previousRoom) {
        queryClient.setQueryData(['room', variables.id], context.previousRoom);
      }
      toast.error(`Failed to update room: ${error.message}`);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['room', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success('Room updated successfully');
    },
  });
}

/**
 * Delete room mutation
 */
export function useDeleteRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => facilitiesService.deleteRoom(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success('Room deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete room: ${error.message}`);
    },
  });
}
