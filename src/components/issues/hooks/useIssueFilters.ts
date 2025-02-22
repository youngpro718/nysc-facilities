
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { IssueFiltersType, SortOption, GroupingOption, ViewMode } from "../types/FilterTypes";

export const useIssueFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<IssueFiltersType>(() => ({
    type: (searchParams.get('type') as IssueFiltersType['type']) || 'all_types',
    status: (searchParams.get('status') as IssueFiltersType['status']) || 'all_statuses',
    priority: (searchParams.get('priority') as IssueFiltersType['priority']) || 'all_priorities',
    assigned_to: (searchParams.get('assigned_to') as IssueFiltersType['assigned_to']) || 'all_assignments',
    lightingType: (searchParams.get('lightingType') as IssueFiltersType['lightingType']) || 'all_lighting_types',
    fixtureStatus: (searchParams.get('fixtureStatus') as IssueFiltersType['fixtureStatus']) || 'all_fixture_statuses',
    electricalIssue: (searchParams.get('electricalIssue') as IssueFiltersType['electricalIssue']) || 'all_electrical_issues'
  }));
  const [sort, setSort] = useState<SortOption>({ field: 'created_at', direction: 'desc' });
  const [grouping, setGrouping] = useState<GroupingOption>('none');
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  // Update URL when filters change
  useEffect(() => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(filters).forEach(([key, value]) => {
      if (value && !value.includes('all_')) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });
    setSearchParams(newParams, { replace: true });
  }, [filters, setSearchParams]);

  // Handle filter updates
  const updateFilters = (newFilters: Partial<IssueFiltersType>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  return {
    filters,
    setFilters: updateFilters,
    sort,
    setSort,
    grouping,
    setGrouping,
    viewMode,
    setViewMode
  };
};

