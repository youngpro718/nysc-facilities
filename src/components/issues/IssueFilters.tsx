
import { TypeFilters } from "./filters/TypeFilters";
import { SortAndGroupFilters } from "./filters/SortAndGroupFilters";
import { LightingFilters } from "./filters/LightingFilters";
import { IssueFilters as IssueFiltersType, SortOption, GroupingOption, ViewMode } from "./types/FilterTypes";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

interface IssueFiltersProps {
  onFilterChange: (filters: Partial<IssueFiltersType>) => void;
  onSortChange: (sort: SortOption) => void;
  onGroupingChange: (grouping: GroupingOption) => void;
  viewMode: ViewMode;
}

export const IssueFilters = ({ 
  onFilterChange, 
  onSortChange, 
  onGroupingChange,
  viewMode 
}: IssueFiltersProps) => {
  const [showLightingFilters, setShowLightingFilters] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize filters from URL params on mount
  useEffect(() => {
    const filters: Partial<IssueFiltersType> = {};
    
    // Define valid keys and their corresponding types
    type ValidFilterKey = keyof IssueFiltersType;
    const validKeys: ValidFilterKey[] = ['type', 'status', 'priority', 'assigned_to', 'lightingType', 'fixtureStatus', 'electricalIssue'];
    
    searchParams.forEach((value, key) => {
      if (validKeys.includes(key as ValidFilterKey)) {
        // Cast the value based on the key type
        filters[key as ValidFilterKey] = value as IssueFiltersType[ValidFilterKey];
      }
    });
    
    if (Object.keys(filters).length > 0) {
      onFilterChange(filters);
    }
  }, []);

  const handleTypeChange = (type: string) => {
    setShowLightingFilters(type === 'LIGHTING');
    updateFilters({ type: type as IssueFiltersType['type'] });
  };

  const updateFilters = (newFilters: Partial<IssueFiltersType>) => {
    // Update URL params
    const updatedParams = new URLSearchParams(searchParams);
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== 'all_types' && value !== 'all_statuses' 
          && value !== 'all_priorities' && value !== 'all_assignments'
          && value !== 'all_lighting_types' && value !== 'all_fixture_statuses'
          && value !== 'all_electrical_issues') {
        updatedParams.set(key, String(value));
      } else {
        updatedParams.delete(key);
      }
    });
    setSearchParams(updatedParams);

    // Call the filter change handler
    onFilterChange(newFilters);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
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
        {viewMode !== 'timeline' && (
          <div className="w-full lg:w-auto">
            <SortAndGroupFilters 
              onSortChange={onSortChange}
              onGroupingChange={onGroupingChange}
            />
          </div>
        )}
      </div>
      <LightingFilters 
        onFilterChange={updateFilters}
        showLightingFilters={showLightingFilters}
      />
    </div>
  );
};

export type { IssueFiltersType, SortOption, GroupingOption };
