
import { ArrowUpDown } from "lucide-react";
import { FilterSelect } from "./FilterSelect";
import { sortOptions, groupingOptions } from "./filterOptions";
import { SortOption, GroupingOption } from "../types/FilterTypes";

interface SortAndGroupFiltersProps {
  onSortChange: (sort: SortOption) => void;
  onGroupingChange: (grouping: GroupingOption) => void;
}

export const SortAndGroupFilters = ({ onSortChange, onGroupingChange }: SortAndGroupFiltersProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center w-full sm:w-auto">
      <FilterSelect
        icon={ArrowUpDown}
        placeholder="Sort by"
        onValueChange={(value) => {
          const [field, direction] = value.split('-');
          onSortChange({ 
            field: field as SortOption['field'], 
            direction: direction as 'asc' | 'desc' 
          });
        }}
        options={sortOptions}
        fullWidth
      />
      <FilterSelect
        placeholder="Group by"
        onValueChange={(value) => onGroupingChange(value as GroupingOption)}
        options={groupingOptions}
        fullWidth
      />
    </div>
  );
};
