
import { useUpdateIssueMutation } from "./useUpdateIssueMutation";
import { useDeleteIssueMutation } from "./useDeleteIssueMutation";

export const useIssueMutations = () => {
  const updateIssueMutation = useUpdateIssueMutation();
  const { deleteIssueMutation, isDeleteInProgress } = useDeleteIssueMutation();

  return {
    updateIssueMutation,
    deleteIssueMutation,
    isDeleteInProgress
  };
};
