
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ViewToggle } from "./ViewToggle";

export interface SpaceListFiltersProps {
  selectedStatus: string;
  onStatusChange: (value: string) => void;
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  sortBy?: string;
  onSortChange?: (value: string) => void;
  view?: "grid" | "list";
  onViewChange?: (view: "grid" | "list") => void;
}

export function SpaceListFilters({ 
  selectedStatus, 
  onStatusChange,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  view,
  onViewChange
}: SpaceListFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2 items-center">
      {searchQuery !== undefined && onSearchChange && (
        <div className="w-full md:w-auto">
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full md:w-[200px]"
          />
        </div>
      )}

      <Select value={selectedStatus} onValueChange={onStatusChange}>
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

      {sortBy !== undefined && onSortChange && (
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name_asc">Name (A-Z)</SelectItem>
            <SelectItem value="name_desc">Name (Z-A)</SelectItem>
            <SelectItem value="updated_desc">Recently Updated</SelectItem>
            <SelectItem value="created_desc">Recently Created</SelectItem>
          </SelectContent>
        </Select>
      )}

      {view !== undefined && onViewChange && (
        <ViewToggle view={view} onViewChange={onViewChange} />
      )}
    </div>
  );
}
