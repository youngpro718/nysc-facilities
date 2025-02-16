
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, ArrowUpDown } from "lucide-react";

export interface KeyFilters {
  type?: "physical_key" | "elevator_pass" | "all_types";
  status?: "available" | "assigned" | "lost" | "decommissioned" | "all_statuses";
  passkey?: "all" | "passkey_only" | "non_passkey";
  building_id?: string | "all_buildings";
}

export interface SortOption {
  field: 'name' | 'type' | 'status' | 'created_at';
  direction: 'asc' | 'desc';
}

interface KeyFiltersProps {
  onFilterChange: (filters: KeyFilters) => void;
  onSortChange: (sort: SortOption) => void;
}

export const KeyFilters = ({ onFilterChange, onSortChange }: KeyFiltersProps) => {
  return (
    <div className="flex flex-wrap gap-4 mb-6">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4" />
        <Select
          onValueChange={(value) => onFilterChange({ type: value as KeyFilters['type'] })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all_types">All types</SelectItem>
            <SelectItem value="physical_key">Physical Key</SelectItem>
            <SelectItem value="elevator_pass">Elevator Pass</SelectItem>
          </SelectContent>
        </Select>

        <Select
          onValueChange={(value) => onFilterChange({ status: value as KeyFilters['status'] })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all_statuses">All statuses</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="assigned">Assigned</SelectItem>
            <SelectItem value="lost">Lost</SelectItem>
            <SelectItem value="decommissioned">Decommissioned</SelectItem>
          </SelectContent>
        </Select>

        <Select
          onValueChange={(value) => onFilterChange({ passkey: value as KeyFilters['passkey'] })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by passkey" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All keys</SelectItem>
            <SelectItem value="passkey_only">Passkeys only</SelectItem>
            <SelectItem value="non_passkey">Non-passkeys</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <ArrowUpDown className="h-4 w-4" />
        <Select
          onValueChange={(value) => {
            const [field, direction] = value.split('-');
            onSortChange({ 
              field: field as SortOption['field'], 
              direction: direction as 'asc' | 'desc' 
            });
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name-asc">Name (A-Z)</SelectItem>
            <SelectItem value="name-desc">Name (Z-A)</SelectItem>
            <SelectItem value="type-asc">Type (A-Z)</SelectItem>
            <SelectItem value="type-desc">Type (Z-A)</SelectItem>
            <SelectItem value="status-asc">Status (A-Z)</SelectItem>
            <SelectItem value="status-desc">Status (Z-A)</SelectItem>
            <SelectItem value="created_at-desc">Newest first</SelectItem>
            <SelectItem value="created_at-asc">Oldest first</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
