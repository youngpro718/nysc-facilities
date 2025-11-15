import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { 
  CoverageAssignment, 
  CreateCoverageAssignmentInput, 
  UpdateCoverageAssignmentInput,
  SessionPeriod,
  BuildingCode 
} from '@/types/courtSessions';
import { toast } from 'sonner';
import { format } from 'date-fns';

export function useCoverageAssignments(date: Date, period: SessionPeriod, buildingCode: BuildingCode) {
  const dateStr = format(date, 'yyyy-MM-dd');
  
  return useQuery({
    queryKey: ['coverage-assignments', dateStr, period, buildingCode],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coverage_assignments')
        .select(`
          *,
          court_rooms (room_number, courtroom_number)
        `)
        .eq('coverage_date', dateStr)
        .eq('period', period)
        .eq('building_code', buildingCode)
        .order('court_rooms(room_number)');
      
      if (error) throw error;
      return data as CoverageAssignment[];
    },
  });
}

export function useCreateCoverageAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateCoverageAssignmentInput) => {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('coverage_assignments')
        .insert({
          ...input,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as CoverageAssignment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coverage-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['court-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['conflict-detection'] });
      toast.success('Coverage assigned successfully');
    },
    onError: (error: Error) => {
      console.error('Error creating coverage:', error);
      toast.error('Failed to assign coverage');
    },
  });
}

export function useUpdateCoverageAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateCoverageAssignmentInput) => {
      const { id, ...updates } = input;

      const { data, error } = await supabase
        .from('coverage_assignments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as CoverageAssignment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coverage-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['court-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['conflict-detection'] });
      toast.success('Coverage updated successfully');
    },
    onError: (error: Error) => {
      console.error('Error updating coverage:', error);
      toast.error('Failed to update coverage');
    },
  });
}

export function useDeleteCoverageAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('coverage_assignments')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coverage-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['court-sessions'] });
      toast.success('Coverage assignment deleted');
    },
    onError: (error: Error) => {
      console.error('Error deleting coverage:', error);
      toast.error('Failed to delete coverage');
    },
  });
}
