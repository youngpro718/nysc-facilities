/**
 * Facilities Page
 * 
 * Comprehensive facility management (rooms, buildings, floors)
 * Route: /facilities
 * 
 * ARCHITECTURE: Thin page - uses feature hooks and components only
 * 
 * @page
 */

import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';

// Import from Facilities feature - single entry point
import {
  useRooms,
  RoomList,
  BuildingSelector,
  FloorSelector,
  type RoomFilters,
  type Room,
} from '@/features/facilities';

export default function Facilities() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');

  // Build filters from URL params
  const buildingId = searchParams.get('building') || undefined;
  const floorId = searchParams.get('floor') || undefined;
  const search = searchParams.get('search') || undefined;

  const filters: RoomFilters = {
    buildingId,
    floorId,
    search,
  };

  // Use feature hook - all data fetching logic is in the feature
  const { data: rooms, isLoading, error, refetch } = useRooms(filters);

  // Handle filter changes - update URL params
  const handleBuildingChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set('building', value);
      newParams.delete('floor'); // Reset floor when building changes
    } else {
      newParams.delete('building');
      newParams.delete('floor');
    }
    setSearchParams(newParams);
  };

  const handleFloorChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set('floor', value);
    } else {
      newParams.delete('floor');
    }
    setSearchParams(newParams);
  };

  const handleSearch = () => {
    const newParams = new URLSearchParams(searchParams);
    if (searchQuery.trim()) {
      newParams.set('search', searchQuery.trim());
    } else {
      newParams.delete('search');
    }
    setSearchParams(newParams);
  };

  const handleClearFilters = () => {
    setSearchParams(new URLSearchParams());
    setSearchQuery('');
  };

  const handleRoomClick = (room: Room) => {
    navigate(`/facilities/${room.id}`);
  };

  const hasActiveFilters = buildingId || floorId || search;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Facilities</h1>
          <p className="text-muted-foreground">
            Manage buildings, floors, and rooms
          </p>
        </div>
        <Button onClick={() => navigate('/facilities/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Add Room
        </Button>
      </div>

      {/* Filters Card */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Building Selector - from feature */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Building</label>
              <BuildingSelector
                value={buildingId}
                onValueChange={handleBuildingChange}
              />
            </div>

            {/* Floor Selector - from feature */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Floor</label>
              <FloorSelector
                buildingId={buildingId}
                value={floorId}
                onValueChange={handleFloorChange}
              />
            </div>

            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Room number or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} size="icon">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button variant="outline" onClick={handleClearFilters}>
              Clear Filters
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Room List - from feature, handles loading/error/empty states */}
      <RoomList
        rooms={rooms || []}
        isLoading={isLoading}
        error={error}
        onRoomClick={handleRoomClick}
        emptyMessage={
          hasActiveFilters
            ? 'No rooms match your filters. Try adjusting your search criteria.'
            : 'No rooms found. Get started by adding your first room.'
        }
      />
    </div>
  );
}
