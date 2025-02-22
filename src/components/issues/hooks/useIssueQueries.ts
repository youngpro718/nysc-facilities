
import { useIssueList } from "./queries/useIssueList";
import { useIssueMutations } from "./mutations/useIssueMutations";

export const useIssueQueries = () => {
  const { data: issues, isLoading } = useIssueList();
  const { updateIssueMutation, deleteIssueMutation } = useIssueMutations();

  return {
    issues,
    isLoading,
    updateIssueMutation,
    deleteIssueMutation,
  };
};
