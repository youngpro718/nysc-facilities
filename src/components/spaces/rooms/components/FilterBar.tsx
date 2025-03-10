
import React from 'react';
import { RefreshCw, Search, GavelSquare } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ViewToggle } from "../../ViewToggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  view: "grid" | "list";
  onViewChange: (view: "grid" | "list") => void;
  onRefresh?: () => void;
  roomTypeFilter?: string;
  onRoomTypeFilterChange?: (value: string) => void;
  onQuickFilter?: (filter: string) => void;
  courtRoomCount?: number;
}

export function FilterBar({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  statusFilter,
  onStatusFilterChange,
  view,
  onViewChange,
  onRefresh,
  roomTypeFilter,
  onRoomTypeFilterChange,
  onQuickFilter,
  courtRoomCount = 0
}: FilterBarProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search rooms by name, number, or type..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex flex-wrap gap-2 sm:flex-nowrap">
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="w-[160px] min-w-[160px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name_asc">Name (A-Z)</SelectItem>
              <SelectItem value="name_desc">Name (Z-A)</SelectItem>
              <SelectItem value="room_number_asc">Room Number (Low-High)</SelectItem>
              <SelectItem value="room_number_desc">Room Number (High-Low)</SelectItem>
              <SelectItem value="created_desc">Newest First</SelectItem>
              <SelectItem value="created_asc">Oldest First</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="w-[160px] min-w-[160px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="under_maintenance">Under Maintenance</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <ViewToggle view={view} onViewChange={onViewChange} />
            {onRefresh && (
              <Button
                variant="outline"
                size="icon"
                onClick={onRefresh}
                title="Refresh"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Quick filters */}
      <div className="flex flex-wrap gap-2">
        {onQuickFilter && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onQuickFilter('courtroom')}
            className="flex items-center gap-1"
          >
            <GavelSquare className="h-4 w-4" />
            <span>Courtrooms</span>
            {courtRoomCount > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {courtRoomCount}
              </Badge>
            )}
          </Button>
        )}
        
        {roomTypeFilter && onRoomTypeFilterChange && (
          <Badge 
            variant="outline" 
            className="flex items-center cursor-pointer"
            onClick={() => onRoomTypeFilterChange('')}
          >
            {roomTypeFilter}
            <span className="ml-1 text-xs">×</span>
          </Badge>
        )}
      </div>
    </div>
  );
}
