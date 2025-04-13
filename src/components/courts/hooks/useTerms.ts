import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  fetchTerms,
  fetchTermById,
  fetchCurrentTerm,
  fetchTermAssignments,
  fetchTermPersonnel,
  createTerm,
  createTermAssignment,
  createTermPersonnel,
  bulkCreateTermData
} from '../services/termService';
import {
  CourtTerm,
  TermAssignment,
  TermPersonnel,
  CreateTermFormData,
  TermImportData
} from '../types/termTypes';

export function useTerms() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const termsQuery = useQuery({
    queryKey: ['courtTerms'],
    queryFn: fetchTerms,
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
  
  const currentTermQuery = useQuery({
    queryKey: ['currentTerm'],
    queryFn: fetchCurrentTerm,
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
  
  const createTermMutation = useMutation({
    mutationFn: (data: CreateTermFormData) => createTerm(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courtTerms'] });
      queryClient.invalidateQueries({ queryKey: ['currentTerm'] });
      toast({
        title: "Term Created",
        description: "The court term has been successfully created.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create court term.",
        variant: "destructive",
      });
    },
  });
  
  const importTermMutation = useMutation({
    mutationFn: (data: TermImportData) => 
      bulkCreateTermData(data.term, data.assignments, data.personnel),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courtTerms'] });
      queryClient.invalidateQueries({ queryKey: ['currentTerm'] });
      toast({
        title: "Term Imported",
        description: "The court term schedule has been successfully imported.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to import court term.",
        variant: "destructive",
      });
    },
  });
  
  return {
    terms: termsQuery.data || [],
    currentTerm: currentTermQuery.data,
    isLoading: termsQuery.isPending || currentTermQuery.isPending,
    isError: termsQuery.isError || currentTermQuery.isError,
    error: termsQuery.error || currentTermQuery.error,
    
    createTerm: createTermMutation.mutate,
    importTerm: importTermMutation.mutate,
    
    isCreating: createTermMutation.isPending,
    isImporting: importTermMutation.isPending,
  };
}

export function useTermDetails(termId: string) {
  const { toast } = useToast();
  
  const termQuery = useQuery({
    queryKey: ['term', termId],
    queryFn: () => fetchTermById(termId),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!termId,
  });
  
  const assignmentsQuery = useQuery({
    queryKey: ['termAssignments', termId],
    queryFn: () => fetchTermAssignments(termId),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!termId,
  });
  
  const personnelQuery = useQuery({
    queryKey: ['termPersonnel', termId],
    queryFn: () => fetchTermPersonnel(termId),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!termId,
  });
  
  return {
    term: termQuery.data,
    assignments: assignmentsQuery.data || [],
    personnel: personnelQuery.data || [],
    isLoading: termQuery.isPending || assignmentsQuery.isPending || personnelQuery.isPending,
    isError: termQuery.isError || assignmentsQuery.isError || personnelQuery.isError,
    error: termQuery.error || assignmentsQuery.error || personnelQuery.error,
  };
}
