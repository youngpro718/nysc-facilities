import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, ArrowUpDown } from "lucide-react";

interface LightingFiltersProps {
  onFilterChange: (filters: LightingFilters) => void;
  onSortChange: (sort: SortOption) => void;
}

export type LightingFilters = {
  type?: "standard" | "emergency" | "motion_sensor" | "all_types";
  status?: "functional" | "maintenance_needed" | "non_functional" | "pending_maintenance" | "scheduled_replacement" | "all_statuses";
  zone_id?: string | "all_zones";
};

export type SortOption = {
  field: 'name' | 'type' | 'status' | 'installation_date';
  direction: 'asc' | 'desc';
};

export const LightingFilters = ({ onFilterChange, onSortChange }: LightingFiltersProps) => {
  return (
    <div className="flex flex-wrap gap-4 mb-6">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4" />
        <Select
          onValueChange={(value) => onFilterChange({ type: value as LightingFilters['type'] })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all_types">All types</SelectItem>
            <SelectItem value="standard">Standard</SelectItem>
            <SelectItem value="emergency">Emergency</SelectItem>
            <SelectItem value="motion_sensor">Motion Sensor</SelectItem>
          </SelectContent>
        </Select>

        <Select
          onValueChange={(value) => onFilterChange({ status: value as LightingFilters['status'] })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all_statuses">All statuses</SelectItem>
            <SelectItem value="functional">Functional</SelectItem>
            <SelectItem value="maintenance_needed">Maintenance Needed</SelectItem>
            <SelectItem value="non_functional">Non Functional</SelectItem>
            <SelectItem value="pending_maintenance">Pending Maintenance</SelectItem>
            <SelectItem value="scheduled_replacement">Scheduled Replacement</SelectItem>
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
            <SelectItem value="installation_date-desc">Newest first</SelectItem>
            <SelectItem value="installation_date-asc">Oldest first</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};