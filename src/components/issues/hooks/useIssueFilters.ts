
import { useState } from "react";
import { IssueFiltersType, SortOption, GroupingOption, ViewMode } from "../types/FilterTypes";

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
  
  const [sort, setSort] = useState<SortOption>({ field: 'created_at', direction: 'desc' });
  const [grouping, setGrouping] = useState<GroupingOption>('none');
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  return {
    filters,
    setFilters,
    sort,
    setSort,
    grouping,
    setGrouping,
    viewMode,
    setViewMode
  };
};

