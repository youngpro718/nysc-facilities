import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EnabledModules {
  spaces: boolean;
  issues: boolean;
  occupants: boolean;
  inventory: boolean;
  supply_requests: boolean;
  keys: boolean;
  lighting: boolean;
  maintenance: boolean;
  court_operations: boolean;
}

const DEFAULT_MODULES: EnabledModules = {
  spaces: true,
  issues: true,
  occupants: true,
  inventory: true,
  supply_requests: true,
  keys: true,
  lighting: true,
  maintenance: true,
  court_operations: true,
};

export function useEnabledModules() {
  const [enabledModules, setEnabledModules] = useState<EnabledModules>(DEFAULT_MODULES);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchEnabledModules = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('enabled_modules')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching enabled modules:', error);
        return;
      }

      if (profile?.enabled_modules && typeof profile.enabled_modules === 'object') {
        const modules = profile.enabled_modules as Record<string, boolean>;
        const validModules: Partial<EnabledModules> = {};
        
        // Only include valid module keys
        Object.keys(DEFAULT_MODULES).forEach(key => {
          if (key in modules && typeof modules[key] === 'boolean') {
            validModules[key as keyof EnabledModules] = modules[key];
          }
        });
        
        setEnabledModules({ ...DEFAULT_MODULES, ...validModules });
      }
    } catch (error) {
      console.error('Error in fetchEnabledModules:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateEnabledModules = async (modules: Partial<EnabledModules>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const updatedModules = { ...enabledModules, ...modules };

      const { error } = await supabase
        .from('profiles')
        .update({ enabled_modules: updatedModules })
        .eq('id', user.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update module preferences",
          variant: "destructive",
        });
        return;
      }

      setEnabledModules(updatedModules);
      toast({
        title: "Success",
        description: "Module preferences updated successfully",
      });
    } catch (error) {
      console.error('Error updating modules:', error);
      toast({
        title: "Error",
        description: "Failed to update module preferences",
        variant: "destructive",
      });
    }
  };

  const resetToDefaults = async () => {
    await updateEnabledModules(DEFAULT_MODULES);
  };

  useEffect(() => {
    fetchEnabledModules();
  }, []);

  return {
    enabledModules,
    loading,
    updateEnabledModules,
    resetToDefaults,
  };
}