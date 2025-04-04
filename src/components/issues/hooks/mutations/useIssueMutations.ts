
import { useUpdateIssueMutation } from "./useUpdateIssueMutation";

export const useIssueMutations = () => {
  const updateIssueMutation = useUpdateIssueMutation();

  return {
    updateIssueMutation,
  };
};
