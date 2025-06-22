
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { createRelocation, updateRelocation } from "../services/mutations/relocationMutations";
import { activateRelocation, completeRelocation, cancelRelocation } from "../services/mutations/statusMutations";
import { fetchRelocations } from "../services/queries/relocationQueries";
import { CreateRelocationFormData, UpdateRelocationFormData, RelocationStatus, RoomRelocation } from "../types/relocationTypes";
import { toast } from "sonner";

interface UseRelocationsParams {
  status?: RelocationStatus;
}

export function useRelocations(params?: UseRelocationsParams) {
  const queryClient = useQueryClient();

  const relocationsQuery = useQuery({
    queryKey: ['relocations', params?.status],
    queryFn: () => fetchRelocations(params?.status),
  });

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
    relocations: relocationsQuery.data || [],
    isLoading: relocationsQuery.isLoading,
    isError: relocationsQuery.isError,
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
