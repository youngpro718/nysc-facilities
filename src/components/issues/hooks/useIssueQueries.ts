
import { useIssueList } from "./queries/useIssueList";
import { useIssueMutations } from "./mutations/useIssueMutations";
import { useIssueFilters } from "./useIssueFilters";

export const useIssueQueries = () => {
  const { filters, searchQuery } = useIssueFilters();
  const { data: issues, isLoading } = useIssueList(filters, searchQuery);
  const { updateIssueMutation, deleteIssueMutation } = useIssueMutations();

  return {
    issues,
    isLoading,
    updateIssueMutation,
    deleteIssueMutation,
  };
};
