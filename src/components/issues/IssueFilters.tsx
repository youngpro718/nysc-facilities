
import { TypeFilters } from "./filters/TypeFilters";
import { SortAndGroupFilters } from "./filters/SortAndGroupFilters";
import { IssueFilters as IssueFiltersType, SortOption, GroupingOption, ViewMode } from "./types/FilterTypes";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

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
  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
        <div className="w-full lg:w-auto">
          <TypeFilters onFilterChange={onFilterChange} />
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
    </div>
  );
};

export type { IssueFiltersType, SortOption, GroupingOption };
