
import { TypeFilters } from "./filters/TypeFilters";
import { SortAndGroupFilters } from "./filters/SortAndGroupFilters";
import { LightingFilters } from "./filters/LightingFilters";
import { IssueFilters as IssueFiltersType, SortOption, GroupingOption, ViewMode } from "./types/FilterTypes";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect } from "react";

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
  const [currentType, setCurrentType] = useState<string>('all_types');

  const handleTypeChange = (type: string) => {
    setCurrentType(type);
    setShowLightingFilters(type === 'LIGHTING');
    onFilterChange({ type });
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
                onFilterChange(filters);
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
        onFilterChange={onFilterChange}
        showLightingFilters={showLightingFilters}
      />
    </div>
  );
};

export type { IssueFiltersType, SortOption, GroupingOption };
