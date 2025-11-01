/**
 * Dashboard Page
 * 
 * Central hub with system overview
 * Route: /
 * 
 * Implements service-layer pattern:
 * - Uses custom React Query hooks
 * - No direct Supabase queries
 * - Proper loading/error/empty states
 * 
 * @page
 */

import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { EmptyState } from '@/components/common/EmptyState';
import { useDashboardStats } from '@/hooks/dashboard/useDashboardStats';
import { useBuildings } from '@/hooks/facilities/useFacilities';
import { Building, Users, Home, Wrench } from 'lucide-react';

export default function Dashboard() {
  // Fetch dashboard data using custom hooks
  const { data: stats, isLoading, error, refetch } = useDashboardStats();
  const { data: buildings } = useBuildings();

  const hasData = stats && stats.totalRooms > 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard</h1>
        </div>
        <LoadingSkeleton type="grid" count={4} />
        <LoadingSkeleton type="card" count={3} />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage error={error} onRetry={refetch} />;
  }

  if (!hasData) {
    return (
      <EmptyState
        title="No data available"
        description="Dashboard data will appear here once the system is set up"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          System Overview
        </p>
      </div>

      {/* Stats Cards - Using real data from service layer */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border rounded-lg p-6 bg-card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Total Rooms</h3>
            <Home className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-3xl font-bold">{stats?.totalRooms || 0}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {stats?.availableRooms || 0} available
          </p>
        </div>

        <div className="border rounded-lg p-6 bg-card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Occupied</h3>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-3xl font-bold">{stats?.occupiedRooms || 0}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {stats?.occupancyRate || 0}% occupancy rate
          </p>
        </div>

        <div className="border rounded-lg p-6 bg-card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Maintenance</h3>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-3xl font-bold">{stats?.maintenanceRooms || 0}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Rooms under maintenance
          </p>
        </div>

        <div className="border rounded-lg p-6 bg-card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Buildings</h3>
            <Building className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-3xl font-bold">{stats?.totalBuildings || 0}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {stats?.totalFloors || 0} total floors
          </p>
        </div>
      </div>

      {/* Building Overview */}
      <div className="border rounded-lg p-6 bg-card">
        <h2 className="text-xl font-semibold mb-4">Building Overview</h2>
        {buildings && buildings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {buildings.map((building: any) => (
              <div key={building.id} className="border rounded-lg p-4">
                <h3 className="font-medium">{building.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {building.address || 'No address'}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No buildings found</p>
        )}
      </div>

      {/* Recent Activity */}
      <div className="border rounded-lg p-6 bg-card">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <p className="text-muted-foreground">
          Recent activity tracking will be implemented in future updates
        </p>
      </div>
    </div>
  );
}
