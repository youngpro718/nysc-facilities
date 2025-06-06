import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  fetchRelocations,
  fetchActiveRelocations,
  fetchRelocationById
} from "../services/queries/relocationQueries";
import {
  createRelocation,
  updateRelocation
} from "../services/mutations/relocationMutations";
import {
  activateRelocation,
  completeRelocation,
  cancelRelocation
} from "../services/mutations/statusMutations";
import {
  CreateRelocationFormData,
  UpdateRelocationFormData,
  RoomRelocation,
  ActiveRelocation,
  RelocationStatus
} from "../types/relocationTypes";

interface UseRelocationsProps {
  status?: string;
  buildingId?: string;
  floorId?: string;
  startDate?: string;
  endDate?: string;
}

export function useRelocations(props: UseRelocationsProps = {}) {
  const { status, buildingId, floorId, startDate, endDate } = props;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const relocationsQuery = useQuery({
    queryKey: ['relocations', status as RelocationStatus, buildingId, floorId, startDate, endDate],
    queryFn: () => fetchRelocations(status as RelocationStatus, buildingId, floorId, startDate, endDate),
    staleTime: 1000 * 60 * 5,
    retry: 2,
    meta: {
      onError: (error: Error) => {
        console.error('Error fetching relocations:', error);
        toast({
          title: "Error Loading Relocations",
          description: "There was a problem loading the relocations. Please try again.",
          variant: "destructive",
        });
      }
    }
  });

  const activeRelocationsQuery = useQuery({
    queryKey: ['activeRelocations'],
    queryFn: async () => {
      try {
        return await fetchActiveRelocations();
      } catch (error) {
        console.error('Error fetching from active_relocations view:', error);
        const allRelocations = await fetchRelocations('active');
        return allRelocations.filter(r => r.status === 'active');
      }
    },
    staleTime: 1000 * 60 * 5,
    retry: 2,
    meta: {
      onError: (error: Error) => {
        console.error('Error fetching active relocations:', error);
        toast({
          title: "Error Loading Active Relocations",
          description: "There was a problem loading active relocations. Please try again.",
          variant: "destructive",
        });
      }
    }
  });

  const createRelocationMutation = useMutation({
    mutationFn: (data: CreateRelocationFormData) => createRelocation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relocations'] });
      queryClient.invalidateQueries({ queryKey: ['activeRelocations'] });
      toast({
        title: "Relocation created",
        description: "The relocation has been successfully created.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create relocation.",
        variant: "destructive",
      });
      console.error('Error creating relocation:', error);
    },
  });

  const updateRelocationMutation = useMutation({
    mutationFn: (data: UpdateRelocationFormData) => updateRelocation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relocations'] });
      queryClient.invalidateQueries({ queryKey: ['activeRelocations'] });
      toast({
        title: "Relocation updated",
        description: "The relocation has been successfully updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update relocation.",
        variant: "destructive",
      });
      console.error('Error updating relocation:', error);
    },
  });

  const activateRelocationMutation = useMutation({
    mutationFn: (id: string) => activateRelocation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relocations'] });
      queryClient.invalidateQueries({ queryKey: ['activeRelocations'] });
      toast({
        title: "Relocation activated",
        description: "The relocation has been successfully activated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to activate relocation.",
        variant: "destructive",
      });
      console.error('Error activating relocation:', error);
    },
  });

  const completeRelocationMutation = useMutation({
    mutationFn: (id: string) => completeRelocation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relocations'] });
      queryClient.invalidateQueries({ queryKey: ['activeRelocations'] });
      toast({
        title: "Relocation completed",
        description: "The relocation has been successfully completed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to complete relocation.",
        variant: "destructive",
      });
      console.error('Error completing relocation:', error);
    },
  });

  const cancelRelocationMutation = useMutation({
    mutationFn: (id: string) => cancelRelocation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relocations'] });
      queryClient.invalidateQueries({ queryKey: ['activeRelocations'] });
      toast({
        title: "Relocation cancelled",
        description: "The relocation has been successfully cancelled.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel relocation.",
        variant: "destructive",
      });
      console.error('Error cancelling relocation:', error);
    },
  });

  return {
    relocations: relocationsQuery.data || [],
    activeRelocations: activeRelocationsQuery.data || [],
    isLoading: relocationsQuery.isPending || activeRelocationsQuery.isPending,
    isError: relocationsQuery.isError || activeRelocationsQuery.isError,
    error: relocationsQuery.error || activeRelocationsQuery.error,
    
    createRelocation: createRelocationMutation.mutate,
    updateRelocation: updateRelocationMutation.mutate,
    activateRelocation: activateRelocationMutation.mutate,
    completeRelocation: completeRelocationMutation.mutate,
    cancelRelocation: cancelRelocationMutation.mutate,
    
    isCreating: createRelocationMutation.isPending,
    isUpdating: updateRelocationMutation.isPending,
    isActivating: activateRelocationMutation.isPending,
    isCompleting: completeRelocationMutation.isPending,
    isCancelling: cancelRelocationMutation.isPending,
  };
}

export function useRelocationDetails(id: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const relocationQuery = useQuery({
    queryKey: ['relocation', id],
    queryFn: () => fetchRelocationById(id),
    staleTime: 1000 * 60 * 5,
    enabled: !!id,
  });

  const updateRelocationMutation = useMutation({
    mutationFn: (data: UpdateRelocationFormData) => updateRelocation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relocation', id] });
      queryClient.invalidateQueries({ queryKey: ['relocations'] });
      queryClient.invalidateQueries({ queryKey: ['activeRelocations'] });
      toast({
        title: "Relocation updated",
        description: "The relocation has been successfully updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update relocation.",
        variant: "destructive",
      });
      console.error('Error updating relocation:', error);
    },
  });

  const activateRelocationMutation = useMutation({
    mutationFn: () => activateRelocation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relocation', id] });
      queryClient.invalidateQueries({ queryKey: ['relocations'] });
      queryClient.invalidateQueries({ queryKey: ['activeRelocations'] });
      toast({
        title: "Relocation activated",
        description: "The relocation has been successfully activated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to activate relocation.",
        variant: "destructive",
      });
      console.error('Error activating relocation:', error);
    },
  });

  const completeRelocationMutation = useMutation({
    mutationFn: () => completeRelocation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relocation', id] });
      queryClient.invalidateQueries({ queryKey: ['relocations'] });
      queryClient.invalidateQueries({ queryKey: ['activeRelocations'] });
      toast({
        title: "Relocation completed",
        description: "The relocation has been successfully completed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to complete relocation.",
        variant: "destructive",
      });
      console.error('Error completing relocation:', error);
    },
  });

  const cancelRelocationMutation = useMutation({
    mutationFn: () => cancelRelocation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relocation', id] });
      queryClient.invalidateQueries({ queryKey: ['relocations'] });
      queryClient.invalidateQueries({ queryKey: ['activeRelocations'] });
      toast({
        title: "Relocation cancelled",
        description: "The relocation has been successfully cancelled.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel relocation.",
        variant: "destructive",
      });
      console.error('Error cancelling relocation:', error);
    },
  });

  return {
    relocation: relocationQuery.data as RoomRelocation | undefined,
    isLoading: relocationQuery.isLoading,
    isError: relocationQuery.isError,
    error: relocationQuery.error,
    
    updateRelocation: updateRelocationMutation.mutate,
    activateRelocation: activateRelocationMutation.mutate,
    completeRelocation: completeRelocationMutation.mutate,
    cancelRelocation: cancelRelocationMutation.mutate,
    
    isUpdating: updateRelocationMutation.isPending,
    isActivating: activateRelocationMutation.isPending,
    isCompleting: completeRelocationMutation.isPending,
    isCancelling: cancelRelocationMutation.isPending,
  };
}
