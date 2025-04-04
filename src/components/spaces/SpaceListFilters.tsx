
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  // Ensure all consumers use the same prop names
  statusFilter?: string;
  onStatusFilterChange?: (value: string) => void;
  onRefresh?: () => void;
}

export const SpaceListFilters = ({
  selectedStatus,
  onStatusChange,
  statusFilter, // Allow either naming convention
  onStatusFilterChange,
  sortBy,
  onSortChange,
  view,
  onViewChange,
  onRefresh,
}: SpaceListFiltersProps) => {
  // Use statusFilter as a fallback if selectedStatus isn't provided
  const effectiveStatus = selectedStatus || statusFilter || "all";
  const effectiveOnStatusChange = onStatusChange || onStatusFilterChange || (() => {});
  
  return (
    <div className="flex flex-wrap gap-2">
      <Select value={effectiveStatus} onValueChange={effectiveOnStatusChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filter by status..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
          <SelectItem value="under_maintenance">Under Maintenance</SelectItem>
        </SelectContent>
      </Select>
      
      {sortBy && onSortChange && (
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name_asc">Name (A-Z)</SelectItem>
            <SelectItem value="name_desc">Name (Z-A)</SelectItem>
            <SelectItem value="created_desc">Newest First</SelectItem>
            <SelectItem value="created_asc">Oldest First</SelectItem>
          </SelectContent>
        </Select>
      )}
      
      {view && onViewChange && (
        <div className="ml-auto">
          <ViewToggle view={view} onViewChange={onViewChange} />
        </div>
      )}
    </div>
  );
};
