
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { TypeFilters } from "./filters/TypeFilters";
import { LightingFilters } from "./filters/LightingFilters";
import { IssueFilters as IssueFiltersType, ViewMode } from "./types/FilterTypes";
import { useState } from "react";

interface IssueFiltersProps {
  onFilterChange: (filters: Partial<IssueFiltersType>) => void;
  onSearchChange: (query: string) => void;
  searchQuery: string;
  viewMode: ViewMode;
}

export const IssueFilters = ({ 
  onFilterChange, 
  onSearchChange,
  searchQuery,
  viewMode 
}: IssueFiltersProps) => {
  const [showLightingFilters, setShowLightingFilters] = useState(false);

  const handleTypeChange = (type: string) => {
    console.log("Type filter changed to:", type);
    setShowLightingFilters(type === 'LIGHTING');
    if (isValidType(type)) {
      updateFilters({ type });
    }
  };

  const updateFilters = (newFilters: Partial<IssueFiltersType>) => {
    console.log("Updating filters with:", newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
        <div className="relative w-full lg:w-80">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search issues..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="w-full lg:w-auto">
          <TypeFilters 
            onFilterChange={(filters) => {
              if (filters.type) {
                handleTypeChange(filters.type);
              } else {
                updateFilters(filters);
              }
            }} 
          />
        </div>
      </div>
      <LightingFilters 
        onFilterChange={updateFilters}
        showLightingFilters={showLightingFilters}
      />
    </div>
  );
};

const isValidType = (type: string): type is IssueFiltersType['type'] => {
  return type === 'all_types' || [
    'ACCESS_REQUEST', 'BUILDING_SYSTEMS', 'CEILING', 'CLEANING_REQUEST',
    'CLIMATE_CONTROL', 'DOOR', 'ELECTRICAL_NEEDS', 'EMERGENCY',
    'EXTERIOR_FACADE', 'FLAGPOLE_FLAG', 'FLOORING', 'GENERAL_REQUESTS',
    'LEAK', 'LIGHTING', 'LOCK', 'PLUMBING_NEEDS', 'RESTROOM_REPAIR',
    'SIGNAGE', 'WINDOW'
  ].includes(type);
};
