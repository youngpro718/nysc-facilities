import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { logger } from "@/lib/logger";
import { TypeFilters } from "./filters/TypeFilters";
import { LightingFilters } from "./filters/LightingFilters";
import { IssueFilters as IssueFiltersType } from "./types/FilterTypes";
import { useState, useCallback } from "react";
import { QuickFilters } from "./filters/QuickFilters";

interface IssueFiltersProps {
  onFilterChange: (filters: Partial<IssueFiltersType>) => void;
  onSearchChange: (query: string) => void;
  searchQuery: string;
  viewMode?: string;
}

export const IssueFilters = ({ 
  onFilterChange, 
  onSearchChange,
  searchQuery,
  viewMode 
}: IssueFiltersProps) => {
  const [showLightingFilters, setShowLightingFilters] = useState(false);

  const handleTypeChange = useCallback((type: string) => {
    logger.debug("Type filter changed to:", type);
    setShowLightingFilters(type === 'LIGHTING');
    onFilterChange({ type: type as IssueFiltersType['type'] });
  }, [onFilterChange]);

  const handleFilterChange = useCallback((newFilters: Partial<IssueFiltersType>) => {
    logger.debug("Updating filters with:", newFilters);
    onFilterChange(newFilters);
  }, [onFilterChange]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    logger.debug("Search query changed to:", value);
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
