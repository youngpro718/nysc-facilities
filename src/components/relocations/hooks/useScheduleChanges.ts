import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  fetchScheduleChanges,
  createScheduleChange,
  updateScheduleChange,
  deleteScheduleChange
} from "../services/relocationService";
import {
  CreateScheduleChangeFormData,
  UpdateScheduleChangeFormData,
  ScheduleChange
} from "../types/relocationTypes";

export function useScheduleChanges(relocationId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch schedule changes for a relocation
  const scheduleChangesQuery = useQuery({
    queryKey: ['scheduleChanges', relocationId],
    queryFn: () => fetchScheduleChanges(relocationId),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!relocationId,
  });

  // Create a new schedule change
  const createScheduleChangeMutation = useMutation({
    mutationFn: (data: CreateScheduleChangeFormData) => createScheduleChange(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduleChanges', relocationId] });
      toast({
        title: "Schedule change created",
        description: "The schedule change has been successfully created.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create schedule change.",
        variant: "destructive",
      });
      console.error('Error creating schedule change:', error);
    },
  });

  // Update an existing schedule change
  const updateScheduleChangeMutation = useMutation({
    mutationFn: (data: UpdateScheduleChangeFormData) => updateScheduleChange(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduleChanges', relocationId] });
      toast({
        title: "Schedule change updated",
        description: "The schedule change has been successfully updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update schedule change.",
        variant: "destructive",
      });
      console.error('Error updating schedule change:', error);
    },
  });

  // Delete a schedule change
  const deleteScheduleChangeMutation = useMutation({
    mutationFn: (id: string) => deleteScheduleChange(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduleChanges', relocationId] });
      toast({
        title: "Schedule change deleted",
        description: "The schedule change has been successfully deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete schedule change.",
        variant: "destructive",
      });
      console.error('Error deleting schedule change:', error);
    },
  });

  return {
    // Query
    scheduleChanges: scheduleChangesQuery.data || [],
    isLoading: scheduleChangesQuery.isLoading,
    isError: scheduleChangesQuery.isError,
    error: scheduleChangesQuery.error,
    
    // Mutations
    createScheduleChange: createScheduleChangeMutation.mutate,
    updateScheduleChange: updateScheduleChangeMutation.mutate,
    deleteScheduleChange: deleteScheduleChangeMutation.mutate,
    
    // Mutation states
    isCreating: createScheduleChangeMutation.isPending,
    isUpdating: updateScheduleChangeMutation.isPending,
    isDeleting: deleteScheduleChangeMutation.isPending,
  };
} 