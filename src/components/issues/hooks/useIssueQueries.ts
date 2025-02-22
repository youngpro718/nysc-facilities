
import { useIssueList } from "./queries/useIssueList";
import { useIssueMutations } from "./mutations/useIssueMutations";
import { useIssueFilters } from "./useIssueFilters";

export const useIssueQueries = () => {
  const { filters } = useIssueFilters();
  const { data: issues, isLoading } = useIssueList(filters);
  const { updateIssueMutation, deleteIssueMutation } = useIssueMutations();

  return {
    issues,
    isLoading,
    updateIssueMutation,
    deleteIssueMutation,
  };
};

