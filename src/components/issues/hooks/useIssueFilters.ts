
import { useState, useEffect, useCallback } from "react";
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

  // Memoize the update function to prevent unnecessary re-renders
  const updateSearchParams = useCallback((currentFilters: IssueFiltersType) => {
    const newParams = new URLSearchParams();
    Object.entries(currentFilters).forEach(([key, value]) => {
      if (value && typeof value === 'string' && !value.startsWith('all_')) {
        newParams.set(key, value);
      }
    });
    setSearchParams(newParams, { replace: true });
  }, [setSearchParams]);

  // Debounced effect for URL updates
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateSearchParams(filters);
    }, 500); // 500ms debounce delay

    return () => clearTimeout(timeoutId);
  }, [filters, updateSearchParams]);

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
