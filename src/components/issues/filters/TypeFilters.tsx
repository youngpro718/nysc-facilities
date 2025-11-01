
import { Filter } from "lucide-react";
import { FilterSelect } from "./FilterSelect";
import { typeOptions, statusOptions, priorityOptions, assigneeTypeOptions } from "./filterOptions";
import { IssueFilters } from "../types/FilterTypes";

interface TypeFiltersProps {
  onFilterChange: (filters: Partial<IssueFilters>) => void;
}

export const TypeFilters = ({ onFilterChange }: TypeFiltersProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
      <FilterSelect
        icon={Filter}
        placeholder="Filter by type"
        onValueChange={(value) => onFilterChange({ type: value as IssueFilters['type'] })}
        options={typeOptions}
        fullWidth
      />
      <FilterSelect
        placeholder="Filter by status"
        onValueChange={(value) => onFilterChange({ status: value as IssueFilters['status'] })}
        options={statusOptions}
        fullWidth
      />
      <FilterSelect
        placeholder="Filter by priority"
        onValueChange={(value) => onFilterChange({ priority: value as IssueFilters['priority'] })}
        options={priorityOptions}
        fullWidth
      />
      <FilterSelect
        placeholder="Filter by assignment"
        onValueChange={(value) => onFilterChange({ assigned_to: value as IssueFilters['assigned_to'] })}
        options={assigneeTypeOptions}
        fullWidth
      />
    </div>
  );
};
