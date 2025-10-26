/**
 * Facilities Page
 * 
 * Comprehensive facility management (rooms, buildings, floors)
 * Route: /facilities
 * 
 * @page
 */

import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function Facilities() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // TODO: Implement hooks
  // const { data: rooms, isLoading, error, refetch } = useRooms(filters);
  // const { data: buildings } = useBuildings();
  // const { data: floors } = useFloors(selectedBuilding);

  const isLoading = false;
  const error = null;
  const rooms = [];

  // Get filters from URL
  const buildingId = searchParams.get('building');
  const floorId = searchParams.get('floor');
  const view = searchParams.get('view') || 'grid';

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
    return <ErrorMessage error={error} onRetry={() => {}} />;
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
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Facilities</h1>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Facility
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="border rounded-lg p-4 flex-1">
          <p className="text-sm text-muted-foreground">Filters will appear here</p>
        </div>
      </div>

      {/* Room Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-4">
            <h3 className="font-semibold">Room {101 + i}</h3>
            <p className="text-sm text-muted-foreground mt-2">Office</p>
            <div className="flex gap-2 mt-4">
              <Button size="sm" variant="outline">View</Button>
              <Button size="sm" variant="outline">Edit</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
