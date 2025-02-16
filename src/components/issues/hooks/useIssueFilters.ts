
import { useState } from "react";
import { IssueFiltersType, SortOption, GroupingOption, ViewMode } from "../types/FilterTypes";

export const useIssueFilters = () => {
  const [filters, setFilters] = useState<IssueFiltersType>({});
  const [sort, setSort] = useState<SortOption>({ field: 'created_at', direction: 'desc' });
  const [grouping, setGrouping] = useState<GroupingOption>('none');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');

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

