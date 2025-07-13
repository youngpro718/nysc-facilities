import { useState } from "react";
import { Search, Filter, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Briefcase, GavelIcon, Warehouse, Users, User, Building } from "lucide-react";

interface MobileFilterBarProps {
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

const quickFilters = [
  { key: "office", label: "Office", icon: Briefcase },
  { key: "courtroom", label: "Court", icon: GavelIcon },
  { key: "chamber", label: "Chamber", icon: Building },
  { key: "storage", label: "Storage", icon: Warehouse },
  { key: "male_locker_room", label: "Male", icon: User },
  { key: "female_locker_room", label: "Female", icon: Users },
];

export function MobileFilterBar({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  statusFilter,
  onStatusFilterChange,
  onRefresh,
  roomTypeFilter,
  onRoomTypeFilterChange,
}: MobileFilterBarProps) {
  const [isQuickFiltersOpen, setIsQuickFiltersOpen] = useState(false);
  const activeFilterCount = [statusFilter !== "all", roomTypeFilter !== ""].filter(Boolean).length;

  const handleQuickFilter = (roomType: string) => {
    onRoomTypeFilterChange(roomType === roomTypeFilter ? "" : roomType);
  };

  const clearAllFilters = () => {
    onStatusFilterChange("all");
    onRoomTypeFilterChange("");
  };

  return (
    <div className="space-y-3">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search rooms..."
          className="pl-10 h-12 text-base"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Quick Filter Icons */}
      <Collapsible open={isQuickFiltersOpen} onOpenChange={setIsQuickFiltersOpen}>
        <div className="flex items-center justify-between">
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="h-10 px-3">
              <Filter className="h-4 w-4 mr-2" />
              Quick Filters
              {activeFilterCount > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                  {activeFilterCount}
                </Badge>
              )}
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </CollapsibleTrigger>
          
          <div className="flex gap-2">
            <Button variant="outline" size="icon" className="h-10 w-10" onClick={onRefresh}>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
            </Button>
            
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="h-10 w-10">
                  <Filter className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[50vh]">
                <SheetHeader>
                  <SheetTitle>Advanced Filters</SheetTitle>
                  <SheetDescription>Refine your search results</SheetDescription>
                </SheetHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <Select value={statusFilter} onValueChange={onStatusFilterChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="under_maintenance">Under Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Sort by</label>
                    <Select value={sortBy} onValueChange={onSortChange}>
                      <SelectTrigger>
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
                  </div>
                  
                  {activeFilterCount > 0 && (
                    <Button variant="outline" onClick={clearAllFilters} className="w-full">
                      Clear All Filters
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <CollapsibleContent className="space-y-0">
          <div className="grid grid-cols-3 gap-2 pt-3">
            {quickFilters.map(({ key, label, icon: Icon }) => (
              <Button
                key={key}
                variant={roomTypeFilter === key ? "default" : "outline"}
                size="sm"
                className="h-16 flex-col gap-2 text-xs"
                onClick={() => handleQuickFilter(key)}
              >
                <Icon className="h-5 w-5" />
                <span className="leading-tight">{label}</span>
              </Button>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}