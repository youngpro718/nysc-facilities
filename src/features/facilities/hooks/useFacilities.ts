/**
 * useFacilities Hook
 * 
 * Custom hook for fetching and managing facilities data with React Query
 * 
 * @module features/facilities/hooks/useFacilities
 */

import { useQuery } from '@tanstack/react-query';
import { facilitiesService } from '../services/facilitiesService';
import type { RoomFilters } from '../model';

/**
 * Fetch all rooms with optional filters
 */
export function useRooms(filters?: RoomFilters) {
  return useQuery({
    queryKey: ['rooms', filters],
    queryFn: () => facilitiesService.getRooms(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch single room by ID
 */
export function useRoom(id: string) {
  return useQuery({
    queryKey: ['room', id],
    queryFn: () => facilitiesService.getRoomById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch all buildings
 */
export function useBuildings() {
  return useQuery({
    queryKey: ['buildings'],
    queryFn: () => facilitiesService.getBuildings(),
    staleTime: 10 * 60 * 1000, // 10 minutes (buildings change rarely)
  });
}

/**
 * Fetch floors by building ID
 */
export function useFloors(buildingId?: string) {
  return useQuery({
    queryKey: ['floors', buildingId],
    queryFn: () => facilitiesService.getFloors(buildingId),
    enabled: !!buildingId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
