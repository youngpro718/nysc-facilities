import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { TypeFilters } from "./filters/TypeFilters";
import { LightingFilters } from "./filters/LightingFilters";
import { IssueFilters as IssueFiltersType, ViewMode } from "./types/FilterTypes";
import { useState, useCallback } from "react";
import { QuickFilters } from "./filters/QuickFilters";

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

  const handleTypeChange = useCallback((type: string) => {
    console.log("Type filter changed to:", type);
    setShowLightingFilters(type === 'LIGHTING');
    onFilterChange({ type: type as IssueFiltersType['type'] });
  }, [onFilterChange]);

  const handleFilterChange = useCallback((newFilters: Partial<IssueFiltersType>) => {
    console.log("Updating filters with:", newFilters);
    onFilterChange(newFilters);
  }, [onFilterChange]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    console.log("Search query changed to:", value);
    onSearchChange(value);
  }, [onSearchChange]);

  return (
    <div className="space-y-4">
      <QuickFilters onFilterChange={handleFilterChange} />
      
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
        <div className="relative w-full lg:w-80">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search issues..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-8"
          />
        </div>
        <div className="w-full lg:w-auto">
          <TypeFilters onFilterChange={handleFilterChange} />
        </div>
      </div>

      <LightingFilters 
        onFilterChange={handleFilterChange}
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
