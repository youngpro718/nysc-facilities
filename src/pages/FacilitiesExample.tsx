/**
 * Facilities Page - Example Implementation
 * 
 * This is an example of how to use the Facilities feature in a page.
 * Pages should be THIN - they only use feature hooks and components.
 * 
 * @module pages/FacilitiesExample
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useRooms,
  RoomList,
  BuildingSelector,
  FloorSelector,
  type RoomFilters,
  type Room,
} from '@/features/facilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Plus } from 'lucide-react';

export default function FacilitiesExample() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<RoomFilters>({});
  const [searchQuery, setSearchQuery] = useState('');

  // Use the feature hook - all data fetching logic is encapsulated
  const { data: rooms, isLoading, error } = useRooms(filters);

  // Handle filter changes
  const handleBuildingChange = (buildingId: string) => {
    setFilters((prev) => ({
      ...prev,
      buildingId,
      floorId: undefined, // Reset floor when building changes
    }));
  };

  const handleFloorChange = (floorId: string) => {
    setFilters((prev) => ({ ...prev, floorId }));
  };

  const handleSearch = () => {
    setFilters((prev) => ({ ...prev, search: searchQuery }));
  };

  const handleRoomClick = (room: Room) => {
    navigate(`/facilities/${room.id}`);
  };

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

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Building Selector - uses feature component */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Building</label>
              <BuildingSelector
                value={filters.buildingId}
                onValueChange={handleBuildingChange}
              />
            </div>

            {/* Floor Selector - uses feature component */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Floor</label>
              <FloorSelector
                buildingId={filters.buildingId}
                value={filters.floorId}
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
          {(filters.buildingId || filters.floorId || filters.search) && (
            <Button
              variant="outline"
              onClick={() => {
                setFilters({});
                setSearchQuery('');
              }}
            >
              Clear Filters
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Room List - uses feature component */}
      <RoomList
        rooms={rooms || []}
        isLoading={isLoading}
        error={error}
        onRoomClick={handleRoomClick}
      />
    </div>
  );
}
