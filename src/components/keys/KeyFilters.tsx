
import { Package2, SortDesc, Shield } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import type { KeyFilterOptions, KeyType, SortOption } from "./types/KeyTypes";

interface KeyFiltersProps {
  onFilterChange: (filters: KeyFilterOptions) => void;
  onSortChange: (sort: SortOption) => void;
}

export function KeyFilters({ onFilterChange, onSortChange }: KeyFiltersProps) {
  const [currentFilters, setCurrentFilters] = useState<KeyFilterOptions>({});

  const handleTypeChange = (value: string) => {
    const newFilters = {
      ...currentFilters,
      type: value as KeyType | "all_types",
    };
    setCurrentFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleCaptainOfficeChange = (value: string) => {
    const newFilters = {
      ...currentFilters,
      captainOfficeCopy: value as "all" | "has_copy" | "missing_copy",
    };
    setCurrentFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleSortChange = (value: string) => {
    const [field, direction] = value.split('_');
    onSortChange({
      field: field as 'name' | 'type' | 'status' | 'created_at',
      direction: direction as 'asc' | 'desc'
    });
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-4">
      <div className="flex-1">
        <Select onValueChange={handleTypeChange} defaultValue="all_types">
          <SelectTrigger>
            <Package2 className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all_types">All Types</SelectItem>
            <SelectItem value="physical_key">Physical Keys</SelectItem>
            <SelectItem value="elevator_pass">Elevator Passes</SelectItem>
            <SelectItem value="room_key">Room Keys</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1">
        <Select onValueChange={handleCaptainOfficeChange} defaultValue="all">
          <SelectTrigger>
            <Shield className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Captain's Office" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Keys</SelectItem>
            <SelectItem value="has_copy">Has Copy</SelectItem>
            <SelectItem value="missing_copy">Missing Copy</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1">
        <Select onValueChange={handleSortChange} defaultValue="name_asc">
          <SelectTrigger>
            <SortDesc className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name_asc">Name (A-Z)</SelectItem>
            <SelectItem value="name_desc">Name (Z-A)</SelectItem>
            <SelectItem value="type_asc">Type (A-Z)</SelectItem>
            <SelectItem value="type_desc">Type (Z-A)</SelectItem>
            <SelectItem value="status_asc">Status (A-Z)</SelectItem>
            <SelectItem value="status_desc">Status (Z-A)</SelectItem>
            <SelectItem value="created_at_desc">Newest First</SelectItem>
            <SelectItem value="created_at_asc">Oldest First</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
