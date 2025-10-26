/**
 * Operations Page
 * 
 * Unified operations hub (issues, maintenance, requests)
 * Route: /ops
 * 
 * Implements service-layer pattern:
 * - Uses custom React Query hooks
 * - No direct Supabase queries
 * - Proper loading/error/empty states
 * - Compact room cards (8 per row)
 * - Tabbed interface for different operations
 * 
 * @page
 */

import { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Plus, 
  Search, 
  Filter,
  AlertCircle,
  Wrench,
  Key,
  Package,
  Building2,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { useRooms, useBuildings } from '@/hooks/facilities/useFacilities';

export default function Operations() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  
  const activeTab = searchParams.get('tab') || 'rooms';
  const buildingId = searchParams.get('building') || undefined;
  const status = searchParams.get('status') || undefined;
  const priority = searchParams.get('priority') || undefined;

  // Build filters
  const filters = useMemo(() => ({
    buildingId,
    status,
    search: searchQuery || undefined,
  }), [buildingId, status, searchQuery]);

  // Fetch data using custom hooks
  const { data: rooms, isLoading, error, refetch } = useRooms(filters);
  const { data: buildings } = useBuildings();

  // Update URL params
  const updateFilter = (key: string, value: string | null) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  // Group rooms by status for operations view
  const roomsByStatus = useMemo(() => {
    if (!rooms) return { maintenance: [], occupied: [], available: [], reserved: [] };
    
    return {
      maintenance: rooms.filter((r: any) => r.status === 'maintenance'),
      occupied: rooms.filter((r: any) => r.status === 'occupied'),
      available: rooms.filter((r: any) => r.status === 'available'),
      reserved: rooms.filter((r: any) => r.status === 'reserved'),
    };
  }, [rooms]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Operations</h1>
        </div>
        <LoadingSkeleton type="card" count={6} />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage error={error} onRetry={refetch} />;
  }

  // Helper to get status icon and color
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'available':
        return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' };
      case 'occupied':
        return { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-100' };
      case 'maintenance':
        return { icon: Wrench, color: 'text-yellow-600', bg: 'bg-yellow-100' };
      case 'reserved':
        return { icon: AlertCircle, color: 'text-purple-600', bg: 'bg-purple-100' };
      default:
        return { icon: XCircle, color: 'text-gray-600', bg: 'bg-gray-100' };
    }
  };

  // Render compact room card (8 per row)
  const RoomCard = ({ room }: { room: any }) => {
    const statusInfo = getStatusInfo(room.status);
    const StatusIcon = statusInfo.icon;

    return (
      <div
        className="border rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer bg-card"
        onClick={() => navigate(`/facilities/${room.id}`)}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded ${statusInfo.bg}`}>
              <StatusIcon className={`h-3.5 w-3.5 ${statusInfo.color}`} />
            </div>
            <span className="font-semibold text-sm">{room.room_number}</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mb-1">
          {room.building?.name}
        </p>
        <p className="text-xs text-muted-foreground">
          Floor {room.floor?.floor_number}
        </p>
        <div className="mt-2 pt-2 border-t">
          <span className={`text-xs px-2 py-0.5 rounded-full ${statusInfo.bg} ${statusInfo.color}`}>
            {room.status}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Operations</h1>
          <p className="text-muted-foreground mt-1">
            Manage facilities, maintenance, and requests
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Quick Action
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search rooms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select value={buildingId || ''} onValueChange={(value) => updateFilter('building', value || null)}>
          <SelectTrigger className="w-full md:w-[200px]">
            <Building2 className="h-4 w-4 mr-2" />
            <SelectValue placeholder="All Buildings" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Buildings</SelectItem>
            {buildings?.map((building: any) => (
              <SelectItem key={building.id} value={building.id}>
                {building.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={status || ''} onValueChange={(value) => updateFilter('status', value || null)}>
          <SelectTrigger className="w-full md:w-[200px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="occupied">Occupied</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
            <SelectItem value="reserved">Reserved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="border rounded-lg p-4 bg-card">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium">Available</span>
          </div>
          <p className="text-2xl font-bold">{roomsByStatus.available.length}</p>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium">Occupied</span>
          </div>
          <p className="text-2xl font-bold">{roomsByStatus.occupied.length}</p>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="flex items-center gap-2 mb-2">
            <Wrench className="h-4 w-4 text-yellow-600" />
            <span className="text-sm font-medium">Maintenance</span>
          </div>
          <p className="text-2xl font-bold">{roomsByStatus.maintenance.length}</p>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium">Reserved</span>
          </div>
          <p className="text-2xl font-bold">{roomsByStatus.reserved.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue={activeTab} onValueChange={(value) => updateFilter('tab', value)}>
        <TabsList>
          <TabsTrigger value="rooms">All Rooms</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="issues">Issues</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
        </TabsList>

        {/* All Rooms Tab */}
        <TabsContent value="rooms" className="space-y-4">
          {!rooms || rooms.length === 0 ? (
            <EmptyState
              title="No rooms found"
              description="Adjust your filters or check back later"
            />
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {rooms.length} {rooms.length === 1 ? 'room' : 'rooms'}
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                {rooms.map((room: any) => (
                  <RoomCard key={room.id} room={room} />
                ))}
              </div>
            </>
          )}
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance" className="space-y-4">
          {roomsByStatus.maintenance.length === 0 ? (
            <EmptyState
              title="No maintenance items"
              description="All facilities are in good condition"
            />
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {roomsByStatus.maintenance.length} {roomsByStatus.maintenance.length === 1 ? 'room' : 'rooms'} under maintenance
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                {roomsByStatus.maintenance.map((room: any) => (
                  <RoomCard key={room.id} room={room} />
                ))}
              </div>
            </>
          )}
        </TabsContent>

        {/* Issues Tab */}
        <TabsContent value="issues">
          <div className="border rounded-lg p-6 bg-card">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="h-5 w-5" />
              <h2 className="text-xl font-semibold">Issues & Tickets</h2>
            </div>
            <p className="text-muted-foreground">
              Issue tracking will be available when the issues module is implemented
            </p>
          </div>
        </TabsContent>

        {/* Requests Tab */}
        <TabsContent value="requests">
          <div className="space-y-4">
            <div className="border rounded-lg p-6 bg-card">
              <div className="flex items-center gap-2 mb-4">
                <Key className="h-5 w-5" />
                <h2 className="text-xl font-semibold">Key Requests</h2>
              </div>
              <p className="text-muted-foreground">
                Key requests will be available when the keys module is implemented
              </p>
            </div>
            <div className="border rounded-lg p-6 bg-card">
              <div className="flex items-center gap-2 mb-4">
                <Package className="h-5 w-5" />
                <h2 className="text-xl font-semibold">Supply Requests</h2>
              </div>
              <p className="text-muted-foreground">
                Supply requests will be available when the supplies module is implemented
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
