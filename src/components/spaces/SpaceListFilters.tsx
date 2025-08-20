import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ViewToggle } from "./ViewToggle";

interface SpaceListFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  view: "grid" | "list" | "master-detail";
  onViewChange: (view: "grid" | "list" | "master-detail") => void;
}

export const SpaceListFilters = ({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  statusFilter,
  onStatusFilterChange,
  view,
  onViewChange,
}: SpaceListFiltersProps) => {
  return (
    <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center">
      <Input
        placeholder="Search by name..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="sm:w-[200px]"
      />
      <Select value={sortBy} onValueChange={onSortChange}>
        <SelectTrigger className="sm:w-[180px]">
          <SelectValue placeholder="Sort by..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="name_asc">Name (A-Z)</SelectItem>
          <SelectItem value="name_desc">Name (Z-A)</SelectItem>
          <SelectItem value="created_desc">Newest First</SelectItem>
          <SelectItem value="created_asc">Oldest First</SelectItem>
        </SelectContent>
      </Select>
      <Select value={statusFilter} onValueChange={onStatusFilterChange}>
        <SelectTrigger className="sm:w-[180px]">
          <SelectValue placeholder="Filter by status..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
          <SelectItem value="under_maintenance">Under Maintenance</SelectItem>
        </SelectContent>
      </Select>
      <div className="ml-auto">
        <ViewToggle view={view} onViewChange={onViewChange} />
      </div>
    </div>
  );
};