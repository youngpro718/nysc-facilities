
import { Search, RefreshCw, Briefcase, GavelIcon, Warehouse, Users, User, Building, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export interface BuildingOption { id: string; name: string }
export interface FloorOption { id: string; name: string; buildingId: string }

const QUICK_FILTERS = [
  { key: "office", label: "Offices", icon: Briefcase },
  { key: "courtroom", label: "Courtrooms", icon: GavelIcon },
  { key: "chamber", label: "Chambers", icon: Building },
  { key: "storage", label: "Storage", icon: Warehouse },
  // Labels say "Locker" so they don't read as gender filters of people.
  { key: "male_locker_room", label: "Men's Locker", icon: User },
  { key: "female_locker_room", label: "Women's Locker", icon: Users },
];

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  onRefresh: () => void;
  roomTypeFilter: string;
  onRoomTypeFilterChange: (value: string) => void;
  /** Building+floor filters are optional so callers that don't yet wire them in
      keep working. Both ids use "all" as the no-filter sentinel. */
  buildings?: BuildingOption[];
  floors?: FloorOption[];
  selectedBuildingId?: string;
  selectedFloorId?: string;
  onBuildingChange?: (id: string) => void;
  onFloorChange?: (id: string) => void;
}

export function FilterBar({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  statusFilter,
  onStatusFilterChange,
  onRefresh,
  roomTypeFilter,
  onRoomTypeFilterChange,
  buildings,
  floors,
  selectedBuildingId = "all",
  selectedFloorId = "all",
  onBuildingChange,
  onFloorChange,
}: FilterBarProps) {
  // Floors narrow to the selected building so the picker isn't an unscoped 17-item list.
  const visibleFloors = (floors ?? []).filter(
    (f) => selectedBuildingId === "all" || f.buildingId === selectedBuildingId,
  );
  // Clicking the active type again clears it (same toggle as MobileFilterBar)
  const handleQuickFilter = (roomType: string) => {
    onRoomTypeFilterChange(roomType === roomTypeFilter ? "" : roomType);
  };

  return (
    <div className="space-y-2" data-tour="building-selector">
      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search rooms..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        {/* onBuildingChange also resets the floor (single URL update in RoomsPage) */}
        {onBuildingChange && (
          <Select value={selectedBuildingId} onValueChange={onBuildingChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All buildings" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All buildings</SelectItem>
              {(buildings ?? []).map((b) => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {onFloorChange && (
          <Select value={selectedFloorId} onValueChange={onFloorChange}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All floors" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All floors</SelectItem>
              {visibleFloors.map((f) => (
                <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="under_maintenance">Under Maintenance</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name_asc">Name (A-Z)</SelectItem>
            <SelectItem value="name_desc">Name (Z-A)</SelectItem>
            <SelectItem value="room_number_asc">Room # (Asc)</SelectItem>
            <SelectItem value="room_number_desc">Room # (Desc)</SelectItem>
            <SelectItem value="updated_at_desc">Recently Updated</SelectItem>
            <SelectItem value="created_at_desc">Recently Added</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="icon" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Quick Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {QUICK_FILTERS.map(({ key, label, icon: Icon }) => (
          <Button
            key={key}
            variant={roomTypeFilter === key ? "default" : "outline"}
            size="sm"
            className="h-8"
            onClick={() => handleQuickFilter(key)}
          >
            <Icon className="h-4 w-4 mr-1" />
            {label}
          </Button>
        ))}
        {roomTypeFilter !== "" && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-muted-foreground"
            onClick={() => onRoomTypeFilterChange("")}
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
