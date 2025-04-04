
import { useUpdateIssueMutation } from "./useUpdateIssueMutation";
import { useDeleteIssueMutation } from "./useDeleteIssueMutation";

export const useIssueMutations = () => {
  const updateIssueMutation = useUpdateIssueMutation();
  const { deleteIssueMutation } = useDeleteIssueMutation();

  return {
    updateIssueMutation,
    deleteIssueMutation,
  };
};
