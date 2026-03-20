import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export interface OnboardingStep {
  id: string;
  user_id: string;
  step_key: string;
  step_title: string;
  step_description: string | null;
  completed: boolean;
  completed_at: string | null;
  step_order: number;
  role_specific: string | null;
  created_at: string;
  updated_at: string;
}

export function useOnboardingChecklist() {
  const queryClient = useQueryClient();

  const { data: steps, isLoading } = useQuery({
    queryKey: ['onboarding-checklist'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('onboarding_checklist')
        .select('*')
        .order('step_order', { ascending: true });

      if (error) {
        logger.error('[useOnboardingChecklist] Failed to fetch checklist:', error);
        throw error;
      }

      return data as OnboardingStep[];
    },
  });

  const completeStepMutation = useMutation({
    mutationFn: async (stepKey: string) => {
      const { error } = await supabase.rpc('complete_onboarding_step', {
        p_step_key: stepKey,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-checklist'] });
    },
    onError: (error) => {
      logger.error('[useOnboardingChecklist] Failed to complete step:', error);
    },
  });

  const initializeChecklistMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.rpc('initialize_onboarding_checklist', {
        p_user_id: userId,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-checklist'] });
    },
    onError: (error) => {
      logger.error('[useOnboardingChecklist] Failed to initialize checklist:', error);
    },
  });

  const completedCount = steps?.filter((s) => s.completed).length || 0;
  const totalCount = steps?.length || 0;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return {
    steps,
    isLoading,
    completedCount,
    totalCount,
    progress,
    completeStep: completeStepMutation.mutate,
    initializeChecklist: initializeChecklistMutation.mutate,
    isCompletingStep: completeStepMutation.isPending,
  };
}
