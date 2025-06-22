
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createRelocation, updateRelocation } from "../services/mutations/relocationMutations";
import { activateRelocation, completeRelocation, cancelRelocation } from "../services/mutations/statusMutations";
import { CreateRelocationFormData, UpdateRelocationFormData, RelocationStatus } from "../types/relocationTypes";
import { toast } from "sonner";

export function useRelocations() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createRelocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relocations'] });
      toast.success('Relocation created successfully');
    },
    onError: (error) => {
      console.error('Error creating relocation:', error);
      toast.error('Failed to create relocation');
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateRelocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relocations'] });
      queryClient.invalidateQueries({ queryKey: ['relocation'] });
      toast.success('Relocation updated successfully');
    },
    onError: (error) => {
      console.error('Error updating relocation:', error);
      toast.error('Failed to update relocation');
    },
  });

  const activateMutation = useMutation({
    mutationFn: activateRelocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relocations'] });
      queryClient.invalidateQueries({ queryKey: ['activeRelocations'] });
      toast.success('Relocation activated successfully');
    },
    onError: (error) => {
      console.error('Error activating relocation:', error);
      toast.error('Failed to activate relocation');
    },
  });

  const completeMutation = useMutation({
    mutationFn: completeRelocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relocations'] });
      queryClient.invalidateQueries({ queryKey: ['activeRelocations'] });
      toast.success('Relocation completed successfully');
    },
    onError: (error) => {
      console.error('Error completing relocation:', error);
      toast.error('Failed to complete relocation');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: cancelRelocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relocations'] });
      queryClient.invalidateQueries({ queryKey: ['activeRelocations'] });
      toast.success('Relocation cancelled successfully');
    },
    onError: (error) => {
      console.error('Error cancelling relocation:', error);
      toast.error('Failed to cancel relocation');
    },
  });

  return {
    createRelocation: createMutation.mutateAsync,
    updateRelocation: updateMutation.mutateAsync,
    activateRelocation: activateMutation.mutateAsync,
    completeRelocation: completeMutation.mutateAsync,
    cancelRelocation: cancelMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isActivating: activateMutation.isPending,
    isCompleting: completeMutation.isPending,
    isCancelling: cancelMutation.isPending,
  };
}
