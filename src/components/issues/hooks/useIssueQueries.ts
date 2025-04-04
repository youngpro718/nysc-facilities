
import { useIssueList } from "./queries/useIssueList";
import { useIssueMutations } from "./mutations/useIssueMutations";
import { IssueFiltersType } from "../types/FilterTypes";
import { Issue } from "../types/IssueTypes";
import { useMemo } from "react";

interface UseIssueQueriesProps {
  filters: IssueFiltersType;
  searchQuery: string;
}

export const useIssueQueries = ({ filters, searchQuery }: UseIssueQueriesProps) => {
  // Memoize adjusted filters to prevent unnecessary recalculations
  const adjustedFilters = useMemo(() => ({
    ...filters,
    status: filters.status === 'all_statuses' 
      ? ['open', 'in_progress'] as ["open", "in_progress"]
      : filters.status
  }), [filters, filters.status]);

  const { data: queryResponse, isLoading, error } = useIssueList(adjustedFilters, searchQuery);
  const { updateIssueMutation } = useIssueMutations();

  // Only log in development environment and when values actually change
  if (process.env.NODE_ENV === 'development') {
    console.log("useIssueQueries - Raw filters:", JSON.stringify(filters, null, 2));
    console.log("useIssueQueries - Adjusted filters:", JSON.stringify(adjustedFilters, null, 2));
    console.log("useIssueQueries - Raw queryResponse:", JSON.stringify(queryResponse, null, 2));
    console.log("useIssueQueries - Error:", error);
    console.log("useIssueQueries - isLoading:", isLoading);
  }

  const issues = queryResponse?.data || [];

  return {
    issues,
    isLoading,
    error,
    updateIssueMutation,
  };
};
