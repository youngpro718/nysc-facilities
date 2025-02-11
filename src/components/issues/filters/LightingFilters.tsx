
import { FilterSelect } from "./FilterSelect";
import { lightingTypeOptions, fixtureStatusOptions, electricalIssueOptions } from "./filterOptions";
import { IssueFilters } from "../types/FilterTypes";

interface LightingFiltersProps {
  onFilterChange: (filters: Partial<IssueFilters>) => void;
  showLightingFilters: boolean;
}

export const LightingFilters = ({ onFilterChange, showLightingFilters }: LightingFiltersProps) => {
  if (!showLightingFilters) return null;

  return (
    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto border-t pt-4 mt-4">
      <FilterSelect
        placeholder="Lighting type"
        onValueChange={(value) => onFilterChange({ lightingType: value })}
        options={lightingTypeOptions}
        fullWidth
      />
      <FilterSelect
        placeholder="Fixture status"
        onValueChange={(value) => onFilterChange({ fixtureStatus: value })}
        options={fixtureStatusOptions}
        fullWidth
      />
      <FilterSelect
        placeholder="Electrical issue"
        onValueChange={(value) => onFilterChange({ electricalIssue: value })}
        options={electricalIssueOptions}
        fullWidth
      />
    </div>
  );
};
