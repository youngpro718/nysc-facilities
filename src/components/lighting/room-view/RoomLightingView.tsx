import { useState, useMemo, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, MapPin, Lightbulb, AlertTriangle } from "lucide-react";
import { LightingFixture } from "@/types/lighting";
import { RoomLightingCard } from "./RoomLightingCard";
import { cn } from "@/lib/utils";

interface RoomLightingViewProps {
  fixtures: LightingFixture[];
  selectedFixtures: string[];
  onFixtureSelect: (fixtureId: string, selected: boolean) => void;
  onFixtureDelete: (fixtureId: string) => void;
  onFixtureUpdated: () => void;
  selectedBuilding?: string;
  selectedFloor?: string;
  targetRoomId?: string;
  targetFixtureId?: string;
}

type RoomGroup = {
  roomId: string;
  roomNumber: string;
  roomName: string;
  buildingName?: string;
  floorName?: string;
  fixtures: LightingFixture[];
};

type FilterType = 'all' | 'with_issues' | 'all_working' | 'no_fixtures';

export const RoomLightingView = ({
  fixtures,
  selectedFixtures,
  onFixtureSelect,
  onFixtureDelete,
  onFixtureUpdated,
  selectedBuilding,
  selectedFloor,
  targetRoomId,
  targetFixtureId
}: RoomLightingViewProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<FilterType>('all');

  // Group fixtures by room
  const roomGroups = useMemo(() => {
    const groups = new Map<string, RoomGroup>();
    
    fixtures.forEach(fixture => {
      const roomKey = fixture.space_id || `unknown-${fixture.room_number || 'no-room'}`;
      const roomNumber = fixture.room_number || 'Unknown Room';
      const roomName = fixture.space_name || 'Unnamed Room';
      
      if (!groups.has(roomKey)) {
        groups.set(roomKey, {
          roomId: roomKey,
          roomNumber,
          roomName,
          buildingName: fixture.building_name || undefined,
          floorName: fixture.floor_name || undefined,
          fixtures: []
        });
      }
      
      groups.get(roomKey)!.fixtures.push(fixture);
    });

    return Array.from(groups.values()).sort((a, b) => {
      // Sort by building, then floor, then room number
      const buildingCompare = (a.buildingName || '').localeCompare(b.buildingName || '');
      if (buildingCompare !== 0) return buildingCompare;
      
      const floorCompare = (a.floorName || '').localeCompare(b.floorName || '');
      if (floorCompare !== 0) return floorCompare;
      
      return a.roomNumber.localeCompare(b.roomNumber);
    });
  }, [fixtures]);

  // Filter rooms based on search and filters
  const filteredRooms = useMemo(() => {
    let filtered = roomGroups;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(room => 
        room.roomNumber.toLowerCase().includes(term) ||
        room.roomName.toLowerCase().includes(term) ||
        room.buildingName?.toLowerCase().includes(term) ||
        room.floorName?.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (filterType !== 'all') {
      filtered = filtered.filter(room => {
        const functionalCount = room.fixtures.filter(f => f.status === 'functional').length;
        const totalCount = room.fixtures.length;
        
        switch (filterType) {
          case 'with_issues':
            return functionalCount < totalCount;
          case 'all_working':
            return functionalCount === totalCount && totalCount > 0;
          case 'no_fixtures':
            return totalCount === 0;
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [roomGroups, searchTerm, filterType]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const totalRooms = roomGroups.length;
    const roomsWithFixtures = roomGroups.filter(r => r.fixtures.length > 0).length;
    const roomsWithIssues = roomGroups.filter(r => 
      r.fixtures.some(f => f.status !== 'functional')
    ).length;
    const totalFixtures = fixtures.length;

    return {
      totalRooms,
      roomsWithFixtures,
      roomsWithIssues,
      totalFixtures
    };
  }, [roomGroups, fixtures]);

  // Auto-focus the target room and optionally fixture
  useEffect(() => {
    if (!targetRoomId) return;
    const el = document.getElementById(`room-card-${targetRoomId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      el.classList.add('ring-2', 'ring-primary');
      window.setTimeout(() => el.classList.remove('ring-2', 'ring-primary'), 2000);
    }
    if (targetFixtureId) {
      // wait a tick for room expansion
      window.setTimeout(() => {
        const fixtureEl = document.querySelector(`[data-fixture-id="${targetFixtureId}"]`);
        if (fixtureEl) {
          (fixtureEl as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
          (fixtureEl as HTMLElement).classList.add('ring-2', 'ring-primary');
          window.setTimeout(() => (fixtureEl as HTMLElement).classList.remove('ring-2', 'ring-primary'), 2000);
        }
      }, 150);
    }
  }, [targetRoomId, targetFixtureId, filteredRooms]);

  return (
    <div className="space-y-6">
      {/* Header with search and filters */}
      <div className="space-y-4">
        {/* Summary stats */}
        <div className="flex flex-wrap gap-4">
          <Badge variant="outline" className="flex items-center gap-2 px-3 py-1">
            <MapPin className="h-4 w-4" />
            {summaryStats.totalRooms} rooms
          </Badge>
          <Badge variant="outline" className="flex items-center gap-2 px-3 py-1">
            <Lightbulb className="h-4 w-4" />
            {summaryStats.totalFixtures} fixtures
          </Badge>
          {summaryStats.roomsWithIssues > 0 && (
            <Badge variant="secondary" className="flex items-center gap-2 px-3 py-1">
              <AlertTriangle className="h-4 w-4" />
              {summaryStats.roomsWithIssues} rooms with issues
            </Badge>
          )}
        </div>

        {/* Search and filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search rooms by number, name, building, or floor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={filterType} onValueChange={(value: FilterType) => setFilterType(value)}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter rooms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Rooms</SelectItem>
              <SelectItem value="with_issues">Rooms with Issues</SelectItem>
              <SelectItem value="all_working">All Working</SelectItem>
              <SelectItem value="no_fixtures">No Fixtures</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Room cards */}
      <div className="space-y-4">
        {filteredRooms.length > 0 ? (
          filteredRooms.map((room) => (
            <RoomLightingCard
              key={room.roomId}
              roomId={room.roomId}
              roomNumber={room.roomNumber}
              roomName={room.roomName}
              buildingName={room.buildingName}
              floorName={room.floorName}
              fixtures={room.fixtures}
              selectedFixtures={selectedFixtures}
              onFixtureSelect={onFixtureSelect}
              onFixtureDelete={onFixtureDelete}
              onFixtureUpdated={onFixtureUpdated}
              defaultExpanded={targetRoomId === room.roomId}
            />
          ))
        ) : (
          <div className="text-center py-12">
            <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">No rooms found</h3>
            <p className="text-muted-foreground">
              {searchTerm 
                ? "Try adjusting your search terms or filters."
                : "No rooms match the current filter criteria."
              }
            </p>
          </div>
        )}
      </div>

      {/* Results summary */}
      {filteredRooms.length > 0 && (
        <div className="text-sm text-muted-foreground text-center">
          Showing {filteredRooms.length} of {summaryStats.totalRooms} rooms
        </div>
      )}
    </div>
  );
};