
import { useIssueList } from "./queries/useIssueList";
import { useIssueMutations } from "./mutations/useIssueMutations";
import { IssueFiltersType } from "../types/FilterTypes";
import { Issue } from "../types/IssueTypes";

interface UseIssueQueriesProps {
  filters: IssueFiltersType;
  searchQuery: string;
}

export const useIssueQueries = ({ filters, searchQuery }: UseIssueQueriesProps) => {
  // Ensure resolved issues only appear in historical tab
  const adjustedFilters = {
    ...filters,
    status: filters.status === 'all_statuses' 
      ? ['open', 'in_progress'] as ["open", "in_progress"] // Explicitly type the array
      : filters.status
  };

  const { data: queryResponse, isLoading, error } = useIssueList(adjustedFilters, searchQuery);
  const { updateIssueMutation, deleteIssueMutation } = useIssueMutations();

  console.log("useIssueQueries - Raw filters:", JSON.stringify(filters, null, 2));
  console.log("useIssueQueries - Adjusted filters:", JSON.stringify(adjustedFilters, null, 2));
  console.log("useIssueQueries - Raw queryResponse:", JSON.stringify(queryResponse, null, 2));
  console.log("useIssueQueries - Error:", error);
  console.log("useIssueQueries - isLoading:", isLoading);

  const issues = queryResponse?.data || [];
  console.log("useIssueQueries - Transformed issues:", issues.length);

  return {
    issues,
    isLoading,
    error,
    updateIssueMutation,
    deleteIssueMutation,
  };
};

