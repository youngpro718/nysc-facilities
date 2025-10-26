/**
 * Facilities Page
 * 
 * Comprehensive facility management (rooms, buildings, floors)
 * Route: /facilities
 * 
 * Implements service-layer pattern:
 * - Uses custom React Query hooks
 * - No direct Supabase queries
 * - Proper loading/error/empty states
 * 
 * @page
 */

import { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Plus, Grid3x3, List, Building2, Layers } from 'lucide-react';
import { useRooms, useBuildings, useFloors } from '@/hooks/facilities/useFacilities';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function Facilities() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Get filters from URL
  const buildingId = searchParams.get('building') || undefined;
  const floorId = searchParams.get('floor') || undefined;
  const status = searchParams.get('status') || undefined;
  const view = searchParams.get('view') || 'grid';

  // Build filters object
  const filters = useMemo(() => ({
    buildingId,
    floorId,
    status,
    search: searchQuery || undefined,
  }), [buildingId, floorId, status, searchQuery]);

  // Fetch data using custom hooks
  const { data: rooms, isLoading, error, refetch } = useRooms(filters);
  const { data: buildings } = useBuildings();
  const { data: floors } = useFloors(buildingId);

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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Facilities</h1>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Facility
          </Button>
        </div>
        <LoadingSkeleton type="grid" count={12} />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage error={error} onRetry={refetch} />;
  }

  if (!rooms || rooms.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Facilities</h1>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Facility
          </Button>
        </div>
        <EmptyState
          title="No facilities found"
          description="Get started by creating your first facility or adjust your filters"
          action={{
            label: 'Create Facility',
            onClick: () => console.log('Create facility'),
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Facilities</h1>
        <div className="flex gap-2">
          <Button
            variant={view === 'grid' ? 'default' : 'outline'}
            size="icon"
            onClick={() => updateFilter('view', 'grid')}
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
          <Button
            variant={view === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => updateFilter('view', 'list')}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Facility
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search facilities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
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

        <Select value={floorId || ''} onValueChange={(value) => updateFilter('floor', value || null)}>
          <SelectTrigger className="w-full md:w-[200px]">
            <Layers className="h-4 w-4 mr-2" />
            <SelectValue placeholder="All Floors" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Floors</SelectItem>
            {floors?.map((floor: any) => (
              <SelectItem key={floor.id} value={floor.id}>
                Floor {floor.floor_number}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={status || ''} onValueChange={(value) => updateFilter('status', value || null)}>
          <SelectTrigger className="w-full md:w-[200px]">
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

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Showing {rooms.length} {rooms.length === 1 ? 'facility' : 'facilities'}
      </div>

      {/* Room Grid/List */}
      <div className={view === 'grid' 
        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        : "space-y-4"
      }>
        {rooms.map((room: any) => (
          <div
            key={room.id}
            className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate(`/facilities/${room.id}`)}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{room.room_number}</h3>
                <p className="text-sm text-muted-foreground">
                  {room.building?.name}, Floor {room.floor?.floor_number}
                </p>
              </div>
              <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                room.status === 'available' ? 'bg-green-100 text-green-800' :
                room.status === 'occupied' ? 'bg-blue-100 text-blue-800' :
                room.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {room.status}
              </span>
            </div>
            {room.room_name && (
              <p className="text-sm mt-2">{room.room_name}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
