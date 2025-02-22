
import { useState } from "react";
import { IssueFiltersType, SortOption, ViewMode } from "../types/FilterTypes";

export const useIssueFilters = () => {
  const [filters, setFilters] = useState<IssueFiltersType>({
    type: 'all_types',
    status: 'all_statuses',
    priority: 'all_priorities',
    assigned_to: 'all_assignments',
    lightingType: 'all_lighting_types',
    fixtureStatus: 'all_fixture_statuses',
    electricalIssue: 'all_electrical_issues'
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sort, setSort] = useState<SortOption>({ field: 'created_at', direction: 'desc' });
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  console.log("Current filters state:", filters);
  console.log("Current search query:", searchQuery);

  return {
    filters,
    setFilters,
    searchQuery,
    setSearchQuery,
    sort,
    setSort,
    viewMode,
    setViewMode
  };
};
