
import { useIssueList } from "./queries/useIssueList";
import { useIssueMutations } from "./mutations/useIssueMutations";
import { IssueFiltersType } from "../types/FilterTypes";
import { Issue } from "../types/IssueTypes";
import { useMemo } from "react";
import { logger } from "@/lib/logger";

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
  const { updateIssueMutation, deleteIssueMutation } = useIssueMutations();

  // Only log in development environment and when values actually change
  if (process.env.NODE_ENV === 'development') {
    logger.debug("useIssueQueries - Raw filters:", JSON.stringify(filters, null, 2));
    logger.debug("useIssueQueries - Adjusted filters:", JSON.stringify(adjustedFilters, null, 2));
    logger.debug("useIssueQueries - Raw queryResponse:", JSON.stringify(queryResponse, null, 2));
    logger.debug("useIssueQueries - Error:", error);
    logger.debug("useIssueQueries - isLoading:", isLoading);
  }

  const issues = queryResponse?.data || [];

  return {
    issues,
    isLoading,
    error,
    updateIssueMutation,
    deleteIssueMutation,
  };
};
