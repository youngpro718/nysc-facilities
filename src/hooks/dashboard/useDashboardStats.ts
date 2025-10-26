/**
 * Dashboard Stats Hook
 * 
 * Custom hook for fetching dashboard statistics
 * Uses React Query for caching and state management
 * 
 * @module hooks/dashboard/useDashboardStats
 */

import { useQuery } from '@tanstack/react-query';
import { db } from '@/services/core/supabaseClient';

/**
 * Dashboard statistics interface
 */
export interface DashboardStats {
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  maintenanceRooms: number;
  totalBuildings: number;
  totalFloors: number;
  occupancyRate: number;
}

/**
 * Fetch dashboard statistics
 */
async function fetchDashboardStats(): Promise<DashboardStats> {
  try {
    // Fetch room counts by status
    const { data: rooms, error: roomsError } = await db
      .from('rooms')
      .select('status')
      .is('deleted_at', null);

    if (roomsError) throw roomsError;

    // Fetch building count
    const { count: buildingCount, error: buildingsError } = await db
      .from('buildings')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null);

    if (buildingsError) throw buildingsError;

    // Fetch floor count
    const { count: floorCount, error: floorsError } = await db
      .from('floors')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null);

    if (floorsError) throw floorsError;

    // Calculate statistics
    const totalRooms = rooms?.length || 0;
    const availableRooms = rooms?.filter(r => r.status === 'available').length || 0;
    const occupiedRooms = rooms?.filter(r => r.status === 'occupied').length || 0;
    const maintenanceRooms = rooms?.filter(r => r.status === 'maintenance').length || 0;
    const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

    return {
      totalRooms,
      availableRooms,
      occupiedRooms,
      maintenanceRooms,
      totalBuildings: buildingCount || 0,
      totalFloors: floorCount || 0,
      occupancyRate: Math.round(occupancyRate * 10) / 10, // Round to 1 decimal
    };
  } catch (error) {
    console.error('[fetchDashboardStats]:', error);
    throw error;
  }
}

/**
 * Hook to fetch dashboard statistics
 * 
 * @returns React Query result with dashboard stats
 * 
 * @example
 * ```tsx
 * const { data: stats, isLoading, error } = useDashboardStats();
 * 
 * if (isLoading) return <LoadingSkeleton />;
 * if (error) return <ErrorMessage error={error} />;
 * 
 * return <div>Total Rooms: {stats.totalRooms}</div>;
 * ```
 */
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: fetchDashboardStats,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  });
}
