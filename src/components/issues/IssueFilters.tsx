
import { TypeFilters } from "./filters/TypeFilters";
import { SortAndGroupFilters } from "./filters/SortAndGroupFilters";
import { LightingFilters } from "./filters/LightingFilters";
import { IssueFilters as IssueFiltersType, SortOption, GroupingOption, ViewMode } from "./types/FilterTypes";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

interface IssueFiltersProps {
  onFilterChange: (filters: IssueFiltersType) => void;
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

  const handleTypeChange = (type: string) => {
    setShowLightingFilters(type === 'LIGHTING');
    updateFilters({ type });
  };

  const updateFilters = (newFilters: Partial<IssueFiltersType>) => {
    // Update URL params
    const updatedParams = new URLSearchParams(searchParams);
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== undefined) {
        updatedParams.set(key, value);
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
