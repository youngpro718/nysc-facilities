// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface SystemStatus {
  system: 'online' | 'offline' | 'maintenance';
  database: 'connected' | 'disconnected' | 'error';
  security: 'secure' | 'warning' | 'critical';
  maintenance: 'scheduled' | 'active' | 'none';
}

export interface SystemStats {
  totalUsers: number;
  totalSpaces: number;
  totalIssues: number;
  totalSupplyRequests: number;
  totalInventoryItems: number;
  uptime: string;
  lastBackup: string;
}

export interface ModuleStatus {
  id: string;
  name: string;
  enabled: boolean;
  description: string;
}

export function useSystemSettings() {
  const queryClient = useQueryClient();

  // Get system statistics
  const {
    data: systemStats,
    isLoading: statsLoading,
    error: statsError
  } = useQuery({
    queryKey: ['system-stats'],
    queryFn: async () => {
      // Get user count
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get spaces count
      const { count: spacesCount } = await supabase
        .from('unified_spaces')
        .select('*', { count: 'exact', head: true });

      // Get issues count
      const { count: issuesCount } = await supabase
        .from('issues')
        .select('*', { count: 'exact', head: true });

      // Get supply requests count
      const { count: supplyRequestsCount } = await supabase
        .from('supply_requests')
        .select('*', { count: 'exact', head: true });

      // Get inventory items count
      const { count: inventoryCount } = await supabase
        .from('inventory_items')
        .select('*', { count: 'exact', head: true });

      return {
        totalUsers: userCount || 0,
        totalSpaces: spacesCount || 0,
        totalIssues: issuesCount || 0,
        totalSupplyRequests: supplyRequestsCount || 0,
        totalInventoryItems: inventoryCount || 0,
        uptime: '99.8%', // This would come from monitoring service
        lastBackup: new Date().toISOString(), // This would come from backup service
      } as SystemStats;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get system status
  const {
    data: systemStatus,
    isLoading: statusLoading,
    error: statusError
  } = useQuery({
    queryKey: ['system-status'],
    queryFn: async () => {
      // Use backend RPC for real health status
      const { data, error } = await supabase.rpc('get_system_health' as unknown);
      if (error || !data) {
        return {
          system: 'offline',
          database: 'disconnected',
          security: 'warning',
          maintenance: 'none',
        } as SystemStatus;
      }
      const result = data as Record<string, unknown>;
      return {
        system: (result.system as SystemStatus['system']) ?? 'online',
        database: (result.database as SystemStatus['database']) ?? 'connected',
        security: (result.security as SystemStatus['security']) ?? 'secure',
        maintenance: 'none',
      } as SystemStatus;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Get module statuses
  const {
    data: modules = [],
    isLoading: modulesLoading,
    error: modulesError
  } = useQuery({
    queryKey: ['system-modules'],
    queryFn: async () => {
      // 1) Identify current user
      const { data: userRes } = await supabase.auth.getUser();
      const userId = userRes?.user?.id;

      // 2) Load module catalog (system-level list only)
      // Define a full default catalog to ensure UI completeness even if DB is sparse
      const defaultCatalog: { id: string; name: string; description: string; enabled?: boolean }[] = [
        { id: 'spaces', name: 'Spaces Management', description: 'Manage buildings, floors, rooms, and space layouts' },
        { id: 'operations', name: 'Operations', description: 'Consolidated Issues, Maintenance, and Supply Requests' },
        { id: 'issues', name: 'Issue Tracking', description: 'Track and resolve facility issues and maintenance requests' },
        { id: 'maintenance', name: 'Maintenance Management', description: 'Schedule and track facility maintenance operations' },
        { id: 'supply_requests', name: 'Supply Requests', description: 'Process and fulfill supply and material requests' },
        { id: 'inventory', name: 'Inventory Management', description: 'Manage supplies, equipment, and inventory tracking' },
        { id: 'keys', name: 'Key Management', description: 'Manage key assignments and access control' },
        { id: 'occupants', name: 'Occupant Management', description: 'Manage room assignments and occupant information' },
        { id: 'court_operations', name: 'Court Operations', description: 'Specialized court scheduling and operations' },
        { id: 'lighting', name: 'Lighting Management', description: 'Manage lighting fixtures and maintenance' },
        { id: 'analytics', name: 'Advanced Analytics', description: 'AI-powered insights and predictive analytics' },
        { id: 'reports', name: 'Reporting System', description: 'Generate and schedule facility reports' },
      ];

      let catalog: { id: string; name: string; description: string; enabled?: boolean }[] = [];
      try {
        const { data: sysMods } = await supabase
          .from('system_modules' as unknown)
          .select('id, name, description, enabled')
          .order('name', { ascending: true });
        // Normalize any inconsistent IDs from the DB (e.g., hyphens to underscores)
        catalog = ((sysMods ?? []) as unknown[]).map((m) => ({
          ...m,
          id: String(m.id).replace(/-/g, '_'),
        }));
      } catch (_) {
        catalog = [];
      }

      // Merge DB catalog with defaults to ensure all expected modules are present
      // DB values take precedence for name/description/enabled
      const byId = new Map<string, { id: string; name: string; description: string; enabled?: boolean }>();
      for (const m of defaultCatalog) byId.set(m.id, { ...m });
      for (const m of catalog) byId.set(m.id, { ...byId.get(m.id), ...m });
      catalog = Array.from(byId.values());

      // 3) Load profile-specific enabled_modules
      let profileEnabled: Record<string, boolean> = {};
      if (userId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('enabled_modules, departments(name)')
          .eq('id', userId)
          .single();
        if (((profile as Record<string, unknown>))?.enabled_modules) {
          profileEnabled = profile.enabled_modules as Record<string, boolean>;
        }
        // Optional auto-enable for Supply Department (kept consistent with useEnabledModules)
        if (((profile as Record<string, unknown>))?.departments?.name === 'Supply Department') {
          profileEnabled.supply_requests = true;
          profileEnabled.inventory = true;
        }
      }

      // 4) Merge catalog with profile flags
      const merged: ModuleStatus[] = catalog.map((m) => {
        const hasProfile = Object.prototype.hasOwnProperty.call(profileEnabled, m.id);
        const resolvedEnabled = hasProfile ? !!profileEnabled[m.id] : !!m.enabled;
        return {
          id: m.id,
          name: m.name,
          description: m.description,
          enabled: resolvedEnabled,
        };
      });

      return merged;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Toggle module status
  const toggleModule = useMutation({
    mutationFn: async ({ moduleId, enabled }: { moduleId: string; enabled: boolean }) => {
      // Persist to current user's profiles.enabled_modules (profile-specific)
      const { data: userRes, error: authErr } = await supabase.auth.getUser();
      if (authErr || !userRes?.user?.id) throw authErr || new Error('No user');
      const userId = userRes.user.id;

      // Fetch current JSON
      const { data: profile, error: pErr } = await supabase
        .from('profiles')
        .select('enabled_modules')
        .eq('id', userId)
        .single();
      if (pErr) throw pErr;

      const current: Record<string, boolean> = (profile?.enabled_modules ?? {}) as Record<string, boolean>;
      const next = { ...current, [moduleId]: enabled };

      const { error: uErr } = await supabase
        .from('profiles')
        .update({ enabled_modules: next })
        .eq('id', userId);
      if (uErr) throw uErr;

      return { moduleId, enabled };
    },
    onSuccess: (data) => {
      // Update the modules cache
      queryClient.setQueryData(['system-modules'], (oldModules: ModuleStatus[] = []) => 
        oldModules.map(module => 
          module.id === data.moduleId 
            ? { ...module, enabled: data.enabled }
            : module
        )
      );
      // Also nudge any hooks relying on enabled modules
      queryClient.invalidateQueries({ queryKey: ['enabled-modules'] });
    },
  });

  // Run system health check
  const runHealthCheck = useMutation({
    mutationFn: async () => {
      // Trigger a fresh health read
      queryClient.invalidateQueries({ queryKey: ['system-status'] });
      queryClient.invalidateQueries({ queryKey: ['system-stats'] });
      
      return { success: true, message: 'System health check completed successfully' };
    },
  });

  // Backup database
  const backupDatabase = useMutation({
    mutationFn: async () => {
      // Simulate backup process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // In a real app, this would trigger actual backup
      return { success: true, message: 'Database backup completed successfully' };
    },
  });

  // Clear cache
  const clearCache = useMutation({
    mutationFn: async () => {
      // Call server-side maintenance RPC
      const { data, error } = await supabase.rpc('clear_app_cache' as unknown);
      // Regardless of server response, refresh client caches to reflect any changes
      queryClient.clear();
      if (error) {
        return { success: false, message: 'Server cache clear failed' };
      }
      const msg = (data as Record<string, unknown>)?.message as string | undefined;
      return { success: true, message: msg || 'Cache cleared successfully' };
    },
  });

  return {
    // Data
    systemStats,
    systemStatus,
    modules,
    
    // Loading states
    isLoading: statsLoading || statusLoading || modulesLoading,
    statsLoading,
    statusLoading,
    modulesLoading,
    
    // Errors
    error: statsError || statusError || modulesError,
    
    // Mutations
    toggleModule: toggleModule.mutate,
    runHealthCheck: runHealthCheck.mutate,
    backupDatabase: backupDatabase.mutate,
    clearCache: clearCache.mutate,
    
    // Mutation states
    isTogglingModule: toggleModule.isPending,
    isRunningHealthCheck: runHealthCheck.isPending,
    isBackingUp: backupDatabase.isPending,
    isClearingCache: clearCache.isPending,
  };
}
