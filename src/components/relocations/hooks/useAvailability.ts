import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  fetchRoomAvailability, 
  fetchMultiRoomAvailability 
} from "../services/queries/availabilityQueries";
import { 
  addWorkAssignment, 
  updateWorkAssignmentStatus, 
  addCourtSession, 
  deleteCourtSession 
} from "../services/mutations/workAssignmentMutations";
import { 
  DailyAvailability, 
  CreateWorkAssignmentFormData,
  CreateCourtSessionFormData,
  WorkAssignmentStatus
} from "../types/relocationTypes";
import { format, addDays } from "date-fns";

interface UseAvailabilityProps {
  roomIds?: string[];
  startDate?: string;
  endDate?: string;
  days?: number;
}

export function useAvailability(props: UseAvailabilityProps = {}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const {
    roomIds = [],
    startDate = format(new Date(), 'yyyy-MM-dd'),
    endDate,
    days = 14
  } = props;
  
  // Calculate end date if not provided
  const calculatedEndDate = endDate || 
    format(addDays(new Date(startDate), days), 'yyyy-MM-dd');

  // Query for a single room's availability
  const singleRoomAvailabilityQuery = useQuery({
    queryKey: ['roomAvailability', roomIds[0], startDate, calculatedEndDate],
    queryFn: () => fetchRoomAvailability(roomIds[0], startDate, calculatedEndDate),
    enabled: roomIds.length === 1,
    staleTime: 1000 * 60 * 5,
    meta: {
      onError: (error: Error) => {
        console.error('Error fetching room availability:', error);
        toast({
          title: "Error Loading Availability",
          description: "There was a problem loading room availability. Please try again.",
          variant: "destructive",
        });
      }
    }
  });

  // Query for multiple rooms' availability
  const multiRoomAvailabilityQuery = useQuery({
    queryKey: ['multiRoomAvailability', roomIds, startDate, calculatedEndDate],
    queryFn: () => fetchMultiRoomAvailability(roomIds, startDate, calculatedEndDate),
    enabled: roomIds.length > 1,
    staleTime: 1000 * 60 * 5,
    meta: {
      onError: (error: Error) => {
        console.error('Error fetching multi-room availability:', error);
        toast({
          title: "Error Loading Availability",
          description: "There was a problem loading room availability. Please try again.",
          variant: "destructive",
        });
      }
    }
  });

  // Mutation to add a work assignment
  const addWorkAssignmentMutation = useMutation({
    mutationFn: (data: CreateWorkAssignmentFormData) => addWorkAssignment({
      ...data,
      created_by: undefined,
      completed_by: undefined
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roomAvailability'] });
      queryClient.invalidateQueries({ queryKey: ['multiRoomAvailability'] });
      queryClient.invalidateQueries({ queryKey: ['relocations'] });
      toast({
        title: "Work Assignment Created",
        description: "The work assignment has been successfully created.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create work assignment.",
        variant: "destructive",
      });
      console.error('Error creating work assignment:', error);
    },
  });

  // Mutation to update a work assignment status
  const updateWorkAssignmentStatusMutation = useMutation({
    mutationFn: ({
      relocationId,
      workAssignmentId,
      status,
      completionNotes
    }: {
      relocationId: string;
      workAssignmentId: string;
      status: WorkAssignmentStatus;
      completionNotes?: string;
    }) => updateWorkAssignmentStatus({
      relocationId,
      workAssignmentId,
      status,
      completionNotes
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roomAvailability'] });
      queryClient.invalidateQueries({ queryKey: ['multiRoomAvailability'] });
      queryClient.invalidateQueries({ queryKey: ['relocations'] });
      toast({
        title: "Work Assignment Updated",
        description: "The work assignment status has been successfully updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update work assignment status.",
        variant: "destructive",
      });
      console.error('Error updating work assignment status:', error);
    },
  });

  // Mutation to add a court session
  const addCourtSessionMutation = useMutation({
    mutationFn: (data: CreateCourtSessionFormData) => addCourtSession({
      ...data,
      status: 'scheduled'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roomAvailability'] });
      queryClient.invalidateQueries({ queryKey: ['multiRoomAvailability'] });
      queryClient.invalidateQueries({ queryKey: ['relocations'] });
      toast({
        title: "Court Session Created",
        description: "The court session has been successfully created.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create court session.",
        variant: "destructive",
      });
      console.error('Error creating court session:', error);
    },
  });

  // Mutation to delete a court session
  const deleteCourtSessionMutation = useMutation({
    mutationFn: ({ relocationId, courtSessionId }: { relocationId: string; courtSessionId: string }) => 
      deleteCourtSession(relocationId, courtSessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roomAvailability'] });
      queryClient.invalidateQueries({ queryKey: ['multiRoomAvailability'] });
      queryClient.invalidateQueries({ queryKey: ['relocations'] });
      toast({
        title: "Court Session Deleted",
        description: "The court session has been successfully deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete court session.",
        variant: "destructive",
      });
      console.error('Error deleting court session:', error);
    },
  });

  return {
    // Query results
    availability: roomIds.length === 1 
      ? singleRoomAvailabilityQuery.data || []
      : null,
    multiRoomAvailability: roomIds.length > 1 
      ? multiRoomAvailabilityQuery.data || {}
      : null,
    isLoading: singleRoomAvailabilityQuery.isPending || multiRoomAvailabilityQuery.isPending,
    isError: singleRoomAvailabilityQuery.isError || multiRoomAvailabilityQuery.isError,
    error: singleRoomAvailabilityQuery.error || multiRoomAvailabilityQuery.error,
    
    // Mutations
    addWorkAssignment: addWorkAssignmentMutation.mutate,
    updateWorkAssignmentStatus: updateWorkAssignmentStatusMutation.mutate,
    addCourtSession: addCourtSessionMutation.mutate,
    deleteCourtSession: deleteCourtSessionMutation.mutate,
    
    // Status
    isAddingWorkAssignment: addWorkAssignmentMutation.isPending,
    isUpdatingWorkAssignmentStatus: updateWorkAssignmentStatusMutation.isPending,
    isAddingCourtSession: addCourtSessionMutation.isPending,
    isDeletingCourtSession: deleteCourtSessionMutation.isPending,
  };
}
