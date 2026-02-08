
import { IssueListContent } from "../components/IssueListContent";
import { IssueFiltersType } from "../types/FilterTypes";

interface IssueTabContentProps {
  viewMode: 'table' | 'cards';
  onViewModeChange: (mode: 'table' | 'cards') => void;
  filters: IssueFiltersType;
  setFilters: (filters: IssueFiltersType) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeTab: 'active' | 'historical';
  openDialog: (type: 'issueDetails' | 'resolution', data?: unknown) => void;
}

export const IssueTabContent = ({
  viewMode,
  onViewModeChange,
  filters,
  setFilters,
  searchQuery,
  setSearchQuery,
  activeTab,
  openDialog,
}: IssueTabContentProps) => {
  return (
    <div className="space-y-4">
      <IssueListContent
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
        filters={filters}
        setFilters={setFilters}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeTab={activeTab}
        openDialog={openDialog}
      />
    </div>
  );
};
