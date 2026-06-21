import { useQuery, useQueryClient } from '@tanstack/react-query';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';
import { useToast } from '@shared/hooks/use-toast';
import { useAuth } from '@features/auth/hooks/useAuth';

export interface EnabledModules {
  spaces: boolean;
  issues: boolean;
  occupants: boolean;
  inventory: boolean;
  supply_requests: boolean;
  keys: boolean;
  maintenance: boolean;
  court_operations: boolean;
  operations: boolean;
}
export const DEFAULT_MODULES: EnabledModules = {
  spaces: true,
  issues: true,
  occupants: true,
  inventory: true,
  supply_requests: true,
  keys: true,
  maintenance: true,
  court_operations: true,
  operations: true,
};

async function loadEnabledModules(userId: string): Promise<EnabledModules> {
  const systemDefaults: Partial<EnabledModules> = {};
  const { data: sysMods } = await supabase
    .from('system_modules' as never)
    .select('id, enabled');

  if (Array.isArray(sysMods)) {
    sysMods.forEach((module: { id: string; enabled: boolean }) => {
      if (module.id in DEFAULT_MODULES && typeof module.enabled === 'boolean') {
        systemDefaults[module.id as keyof EnabledModules] = module.enabled;
      }
    });
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('enabled_modules')
    .eq('id', userId)
    .single();

  if (error) throw error;

  const profileModules: Partial<EnabledModules> = {};
  if (profile?.enabled_modules && typeof profile.enabled_modules === 'object') {
    const modules = profile.enabled_modules as Record<string, unknown>;
    Object.keys(DEFAULT_MODULES).forEach((key) => {
      if (typeof modules[key] === 'boolean') {
        profileModules[key as keyof EnabledModules] = modules[key] as boolean;
      }
    });
  }

  return { ...DEFAULT_MODULES, ...systemDefaults, ...profileModules };
}

export function useEnabledModules() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const disableGates = import.meta.env.DEV && import.meta.env.VITE_DISABLE_MODULE_GATES === 'true';
  const queryKey = ['enabled-modules', user?.id] as const;

  const query = useQuery({
    queryKey,
    enabled: !!user?.id && !disableGates,
    queryFn: () => loadEnabledModules(user!.id),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const enabledModules = disableGates ? DEFAULT_MODULES : query.data ?? DEFAULT_MODULES;

  const updateEnabledModules = async (modules: Partial<EnabledModules>) => {
    if (!user?.id) return;
    const updatedModules = { ...enabledModules, ...modules };
    if (disableGates) {
      queryClient.setQueryData(queryKey, updatedModules);
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({ enabled_modules: updatedModules })
      .eq('id', user.id);

    if (error) {
      logger.error('Error updating enabled modules:', error);
      toast({
        title: 'Error',
        description: 'Failed to update module preferences',
        variant: 'destructive',
      });
      return;
    }

    queryClient.setQueryData(queryKey, updatedModules);
    toast({ title: 'Success', description: 'Module preferences updated successfully' });
  };

  const resetToDefaults = async () => updateEnabledModules(DEFAULT_MODULES);

  return {
    enabledModules,
    loading: !disableGates && query.isPending,
    updateEnabledModules,
    resetToDefaults,
  };
}
