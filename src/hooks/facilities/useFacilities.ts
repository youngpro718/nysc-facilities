/**
 * Facilities Hooks - React Query Integration
 * 
 * Custom hooks for facilities data fetching and mutations
 * Uses React Query for caching, loading states, and error handling
 * 
 * @module hooks/facilities/useFacilities
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { facilitiesService } from '@/services/facilities/facilitiesService';
import { toast } from 'sonner';

/**
 * Query Keys for React Query cache management
 */
export const facilitiesKeys = {
  all: ['facilities'] as const,
  rooms: () => [...facilitiesKeys.all, 'rooms'] as const,
  room: (id: string) => [...facilitiesKeys.rooms(), id] as const,
  roomsFiltered: (filters: Record<string, unknown>) => [...facilitiesKeys.rooms(), { filters }] as const,
  buildings: () => [...facilitiesKeys.all, 'buildings'] as const,
  floors: (buildingId?: string) => [...facilitiesKeys.all, 'floors', buildingId] as const,
};

/**
 * Hook to fetch all rooms with optional filters
 * 
 * @param filters - Optional filters for rooms
 * @returns React Query result with rooms data
 * 
 * @example
 * ```tsx
 * const { data: rooms, isLoading, error } = useRooms({ status: 'available' });
 * ```
 */
export function useRooms(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: filters ? facilitiesKeys.roomsFiltered(filters) : facilitiesKeys.rooms(),
    queryFn: () => facilitiesService.getRooms(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });
}

/**
 * Hook to fetch single room by ID
 * 
 * @param id - Room ID
 * @param enabled - Whether to enable the query
 * @returns React Query result with room data
 * 
 * @example
 * ```tsx
 * const { data: room, isLoading } = useRoom(roomId);
 * ```
 */
export function useRoom(id: string, enabled = true) {
  return useQuery({
    queryKey: facilitiesKeys.room(id),
    queryFn: () => facilitiesService.getRoomById(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch all buildings
 * 
 * @returns React Query result with buildings data
 * 
 * @example
 * ```tsx
 * const { data: buildings } = useBuildings();
 * ```
 */
export function useBuildings() {
  return useQuery({
    queryKey: facilitiesKeys.buildings(),
    queryFn: () => facilitiesService.getBuildings(),
    staleTime: 10 * 60 * 1000, // 10 minutes (buildings change rarely)
  });
}

/**
 * Hook to fetch floors by building
 * 
 * @param buildingId - Optional building ID to filter floors
 * @returns React Query result with floors data
 * 
 * @example
 * ```tsx
 * const { data: floors } = useFloors(buildingId);
 * ```
 */
export function useFloors(buildingId?: string) {
  return useQuery({
    queryKey: facilitiesKeys.floors(buildingId),
    queryFn: () => facilitiesService.getFloors(buildingId),
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Hook for room mutations (create, update, delete)
 * Includes optimistic updates and cache invalidation
 * 
 * @returns Mutation functions for room operations
 * 
 * @example
 * ```tsx
 * const { createRoom, updateRoom, deleteRoom } = useRoomMutations();
 * 
 * await createRoom.mutateAsync({ room_number: '101', ... });
 * ```
 */
export function useRoomMutations() {
  const queryClient = useQueryClient();

  const createRoom = useMutation({
    mutationFn: (roomData: Record<string, unknown>) => facilitiesService.createRoom(roomData),
    onSuccess: () => {
      // Invalidate and refetch rooms list
      queryClient.invalidateQueries({ queryKey: facilitiesKeys.rooms() });
      toast.success('Room created successfully');
    },
    onError: (error: unknown) => {
      toast.error(`Failed to create room: ${error.message}`);
    },
  });

  const updateRoom = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Record<string, unknown> }) =>
      facilitiesService.updateRoom(id, updates),
    onMutate: async ({ id, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: facilitiesKeys.room(id) });

      // Snapshot previous value
      const previousRoom = queryClient.getQueryData(facilitiesKeys.room(id));

      // Optimistically update
      queryClient.setQueryData(facilitiesKeys.room(id), (old: Record<string, unknown>) => ({
        ...old,
        ...updates,
      }));

      return { previousRoom };
    },
    onError: ( error: unknown, { id }, context) => {
      // Rollback on error
      if (context?.previousRoom) {
        queryClient.setQueryData(facilitiesKeys.room(id), context.previousRoom);
      }
      toast.error(`Failed to update room: ${error.message}`);
    },
    onSuccess: (data, { id }) => {
      // Update cache with server data
      queryClient.setQueryData(facilitiesKeys.room(id), data);
      queryClient.invalidateQueries({ queryKey: facilitiesKeys.rooms() });
      toast.success('Room updated successfully');
    },
  });

  const deleteRoom = useMutation({
    mutationFn: (id: string) => facilitiesService.deleteRoom(id),
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: facilitiesKeys.room(id) });
      queryClient.invalidateQueries({ queryKey: facilitiesKeys.rooms() });
      toast.success('Room deleted successfully');
    },
    onError: (error: unknown) => {
      toast.error(`Failed to delete room: ${error.message}`);
    },
  });

  return {
    createRoom,
    updateRoom,
    deleteRoom,
  };
}
