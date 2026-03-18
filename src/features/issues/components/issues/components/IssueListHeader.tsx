import { Button } from "@/components/ui/button";
import { IssueFilters } from "../IssueFilters";
import { IssueFiltersType } from "../types/FilterTypes";

interface IssueListHeaderProps {
  viewMode: 'cards' | 'table';
  onViewModeChange: (mode: 'cards' | 'table') => void;
  filters: IssueFiltersType;
  setFilters: (filters: Partial<IssueFiltersType>) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const IssueListHeader = ({
  viewMode,
  onViewModeChange,
  filters,
  setFilters,
  searchQuery,
  setSearchQuery,
}: IssueListHeaderProps) => {
  return (
    <div className="space-y-4 mb-6">
      <div className="flex justify-end">
        <Button
          variant={viewMode === 'cards' ? 'default' : 'outline'}
          onClick={() => onViewModeChange('cards')}
          className="mr-2"
        >
          Cards
        </Button>
        <Button
          variant={viewMode === 'table' ? 'default' : 'outline'}
          onClick={() => onViewModeChange('table')}
        >
          Table
        </Button>
      </div>
      
      <IssueFilters
        onFilterChange={setFilters}
        onSearchChange={setSearchQuery}
        searchQuery={searchQuery}
        viewMode={viewMode}
      />
    </div>
  );
};
