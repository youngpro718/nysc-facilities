// @ts-nocheck
import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';
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
  operations: boolean;
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
  operations: true,
};

export function useEnabledModules() {
  const [enabledModules, setEnabledModules] = useState<EnabledModules>(DEFAULT_MODULES);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  // Dev-only bypass to quickly explore the app without toggling modules in DB
  // Set VITE_DISABLE_MODULE_GATES=true in .env.local and restart Vite
  const DISABLE_GATES = import.meta.env.VITE_DISABLE_MODULE_GATES === 'true';

  const fetchEnabledModules = async () => {
    if (DISABLE_GATES) {
      // Immediately use defaults and skip network
      setEnabledModules(DEFAULT_MODULES);
      setLoading(false);
      return;
    }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load system-level module defaults from catalog (if available)
      let systemDefaults: Partial<EnabledModules> = {};
      try {
        const { data: sysMods } = await supabase
          .from('system_modules' as unknown)
          .select('id, enabled');
        if (sysMods && Array.isArray(sysMods)) {
          sysMods.forEach((m: Record<string, unknown>) => {
            const key = m.id as keyof EnabledModules;
            if (key in DEFAULT_MODULES && typeof m.enabled === 'boolean') {
              systemDefaults[key] = m.enabled as unknown;
            }
          });
        }
      } catch (e) {
        // ignore and fall back to hardcoded defaults
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select(`
          enabled_modules,
          departments(name)
        `)
        .eq('id', user.id)
        .single();

      if (error) {
        logger.error('Error fetching enabled modules:', error);
        return;
      }

      let finalModules = { ...DEFAULT_MODULES, ...systemDefaults };
      
      if (profile?.enabled_modules && typeof profile.enabled_modules === 'object') {
        const modules = profile.enabled_modules as Record<string, boolean>;
        const validModules: Partial<EnabledModules> = {};
        
        // Only include valid module keys
        Object.keys(DEFAULT_MODULES).forEach(key => {
          if (key in modules && typeof modules[key] === 'boolean') {
            validModules[key as keyof EnabledModules] = modules[key];
          }
        });
        
        finalModules = { ...DEFAULT_MODULES, ...systemDefaults, ...validModules };
      }
      
      // Auto-enable supply_requests and inventory for Supply Department users
      if (((profile as Record<string, unknown>))?.departments?.name === 'Supply Department') {
        finalModules.supply_requests = true;
        finalModules.inventory = true;
      }
      
      setEnabledModules(finalModules);
    } catch (error) {
      logger.error('Error in fetchEnabledModules:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateEnabledModules = async (modules: Partial<EnabledModules>) => {
    try {
      const updatedModules = { ...enabledModules, ...modules };
      if (DISABLE_GATES) {
        // Local-only update in dev bypass mode
        setEnabledModules(updatedModules);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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
      logger.error('Error updating modules:', error);
      toast({
        title: "Error",
        description: "Failed to update module preferences",
        variant: "destructive",
      });
    }
  };

  const resetToDefaults = async () => {
    // Pull latest system defaults and reset profile to those
    let systemDefaults: Partial<EnabledModules> = {};
    try {
      const { data: sysMods } = await supabase
        .from('system_modules' as unknown)
        .select('id, enabled');
      if (sysMods && Array.isArray(sysMods)) {
        sysMods.forEach((m: Record<string, unknown>) => {
          const key = m.id as keyof EnabledModules;
          if (key in DEFAULT_MODULES && typeof m.enabled === 'boolean') {
            systemDefaults[key] = m.enabled as unknown;
          }
        });
      }
    } catch (e) {
      // ignore, fall back to hardcoded defaults
    }
    await updateEnabledModules({ ...DEFAULT_MODULES, ...systemDefaults });
  };

  useEffect(() => {
    fetchEnabledModules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [DISABLE_GATES]);

  return {
    enabledModules,
    loading,
    updateEnabledModules,
    resetToDefaults,
  };
}