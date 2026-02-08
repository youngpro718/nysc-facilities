
import { Search, RefreshCw, Briefcase, GavelIcon, Warehouse, Users, User, Building } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
}: FilterBarProps) {
  const handleQuickFilter = (roomType: string) => {
    onRoomTypeFilterChange(roomType);
  };
  const handleClearFilter = () => {
    onRoomTypeFilterChange("");
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search rooms..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
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
        <Button 
          variant={roomTypeFilter === "office" ? "default" : "outline"} 
          size="sm" 
          className="h-8" 
          onClick={() => handleQuickFilter("office")}
        >
          <Briefcase className="h-4 w-4 mr-1" />
          Offices
        </Button>
        <Button 
          variant={roomTypeFilter === "courtroom" ? "default" : "outline"} 
          size="sm" 
          className="h-8" 
          onClick={() => handleQuickFilter("courtroom")}
        >
          <GavelIcon className="h-4 w-4 mr-1" />
          Courtrooms
        </Button>
        <Button 
          variant={roomTypeFilter === "chamber" ? "default" : "outline"} 
          size="sm" 
          className="h-8" 
          onClick={() => handleQuickFilter("chamber")}
        >
          <Building className="h-4 w-4 mr-1" />
          Chambers
        </Button>
        <Button 
          variant={roomTypeFilter === "storage" ? "default" : "outline"} 
          size="sm" 
          className="h-8" 
          onClick={() => handleQuickFilter("storage")}
        >
          <Warehouse className="h-4 w-4 mr-1" />
          Storage
        </Button>
        <Button 
          variant={roomTypeFilter === "male_locker_room" ? "default" : "outline"} 
          size="sm" 
          className="h-8" 
          onClick={() => handleQuickFilter("male_locker_room")}
        >
          <User className="h-4 w-4 mr-1" />
          Male Locker
        </Button>
        <Button 
          variant={roomTypeFilter === "female_locker_room" ? "default" : "outline"} 
          size="sm" 
          className="h-8" 
          onClick={() => handleQuickFilter("female_locker_room")}
        >
          <Users className="h-4 w-4 mr-1" />
          Female Locker
        </Button>
        <Button 
          variant={roomTypeFilter === "" ? "default" : "outline"} 
          size="sm" 
          className="h-8" 
          onClick={handleClearFilter}
        >
          Clear
        </Button>
      </div>
    </div>
  );
}
