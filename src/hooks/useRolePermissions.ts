import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

// Import the canonical role type from config
import type { UserRole } from '@/config/roles';

// Re-export for backward compatibility
export type CourtRole = UserRole;

export type PermissionLevel = 'read' | 'write' | 'admin';

export interface RolePermissions {
  spaces: PermissionLevel | null;
  issues: PermissionLevel | null;
  occupants: PermissionLevel | null;
  inventory: PermissionLevel | null;
  supply_requests: PermissionLevel | null;
  supply_orders: PermissionLevel | null;  // NEW: Purchase order management
  keys: PermissionLevel | null;
  lighting: PermissionLevel | null;
  maintenance: PermissionLevel | null;
  court_operations: PermissionLevel | null;
  operations: PermissionLevel | null;
  dashboard: PermissionLevel | null;
}

export function useRolePermissions() {
  const [userRole, setUserRole] = useState<CourtRole | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [permissions, setPermissions] = useState<RolePermissions>({
    spaces: null,
    issues: null,
    occupants: null,
    inventory: null,
    supply_requests: null,
    supply_orders: null,
    keys: null,
    lighting: null,
    maintenance: null,
    court_operations: null,
    operations: null,
    dashboard: null,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  // OPTIMIZATION: Track if we've loaded from cache to show UI faster
  const [loadedFromCache, setLoadedFromCache] = useState(false);
  
  // Define role permissions mapping - 6 ALLOWED ROLES
  const rolePermissionsMap: Record<CourtRole, RolePermissions> = {
    admin: {
      spaces: 'admin',
      issues: 'admin',
      occupants: 'admin',
      inventory: 'admin',
      supply_requests: 'admin',
      supply_orders: 'admin',
      keys: 'admin',
      lighting: 'admin',
      maintenance: 'admin',
      court_operations: 'admin',
      operations: 'admin',
      dashboard: 'admin',
    },
    facilities_manager: {
      spaces: 'admin',
      issues: 'admin',
      occupants: 'admin',
      inventory: 'write',
      supply_requests: 'write',
      supply_orders: null,
      keys: 'admin',
      lighting: 'admin',
      maintenance: 'admin',
      court_operations: null,
      operations: 'admin',
      dashboard: 'admin',
    },
    cmc: {
      spaces: null,
      issues: 'write',
      occupants: 'read',
      inventory: null,
      supply_requests: 'write',
      supply_orders: null,
      keys: 'write',
      lighting: null,
      maintenance: null,
      court_operations: 'write',
      operations: 'write',
      dashboard: 'read',
    },
    court_aide: {
      spaces: null,
      issues: 'write',
      occupants: 'read',
      inventory: 'admin',
      supply_requests: 'admin',
      supply_orders: 'admin',
      keys: null,
      lighting: null,
      maintenance: null,
      court_operations: null,
      operations: 'read',
      dashboard: 'read',
    },
    purchasing_staff: {
      spaces: null,
      issues: 'write',
      occupants: 'read',
      inventory: 'admin',
      supply_requests: 'admin',
      supply_orders: 'admin',
      keys: null,
      lighting: null,
      maintenance: null,
      court_operations: null,
      operations: 'read',
      dashboard: 'read',
    },
    standard: {
      spaces: null,
      issues: 'write',
      occupants: null,
      inventory: null,
      supply_requests: 'write',
      supply_orders: null,
      keys: null,
      lighting: null,
      maintenance: null,
      court_operations: null,
      operations: null,
      dashboard: 'read',
    },
  };

  const fetchUserRoleAndPermissions = async (skipCache = false) => {
    const startTime = Date.now();
    logger.debug('[useRolePermissions] Fetch started');
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        logger.debug('[useRolePermissions] No user found');
        return;
      }

      logger.debug('[useRolePermissions] User authenticated');
      
      // SECURITY FIX: Never cache admin permissions to prevent tampering
      // Reduce cache TTL from 2 minutes to 30 seconds for non-admin roles
      if (!skipCache) {
        try {
          const cached = localStorage.getItem(`permissions_cache_${user.id}`);
          if (cached) {
            const { role, profile: cachedProfile, permissions: cachedPerms, timestamp } = JSON.parse(cached);
            const age = Date.now() - timestamp;
            
            // Never use cached admin permissions - always fetch fresh
            if (role === 'admin') {
              logger.info('[useRolePermissions] Admin role detected - skipping cache');
              localStorage.removeItem(`permissions_cache_${user.id}`);
            } else if (age < 30000) {
              // Reduced TTL from 120s to 30s for non-admin roles
              logger.debug('[useRolePermissions] Using cached permissions');
              setUserRole(role);
              setProfile(cachedProfile);
              setPermissions(cachedPerms);
              setLoadedFromCache(true);
              setLoading(false);
              
              logger.debug('[useRolePermissions] Fetching fresh data in background');
            }
          }
        } catch (e) {
          logger.error('[useRolePermissions] Cache read error', e);
        }
      }

      // OPTIMIZATION: Fetch role and profile in parallel
      const [roleQuery, profileQuery] = await Promise.all([
        supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('profiles')
          .select(`
            *,
            departments(name)
          `)
          .eq('id', user.id)
          .maybeSingle()
      ]);

      if (roleQuery.error) {
        logger.error('[useRolePermissions] Error fetching user role (RLS likely)', roleQuery.error);
      }

      let role = (roleQuery.data?.role as CourtRole | null) || null;
      const profileData = profileQuery.data;

      if (!role) {
        // Fallback to secure RPC that bypasses RLS
        try {
          logger.debug('[useRolePermissions] Attempting RPC fallback');
          const { data: secureRole, error: rpcError } = await supabase.rpc('get_current_user_role');
          if (rpcError) {
            logger.error('[useRolePermissions] Error in get_current_user_role RPC', rpcError);
          } else if (secureRole) {
            role = secureRole as CourtRole;
            logger.debug('[useRolePermissions] Role from secure RPC');
          }
        } catch (e) {
          logger.error('[useRolePermissions] Exception calling get_current_user_role', e);
        }
      }

      // Default to standard if still unknown
      if (!role) {
        logger.debug('[useRolePermissions] No role found, defaulting to standard');
        role = 'standard';
      }

      logger.debug('[useRolePermissions] Final role from role lookup layer');
      
      // If user is in Supply Department and NOT admin, treat them as court_aide
      if (profileData?.departments?.name === 'Supply Department' && role !== 'admin') {
        logger.debug('[useRolePermissions] Overriding role to court_aide');
        role = 'court_aide';
      } else if (role === 'admin') {
        logger.debug('[useRolePermissions] Keeping admin role');
      }
      
      logger.debug('[useRolePermissions] Final role before preview');
      setProfile(profileData);

      // rolePermissionsMap moved above

      let effectiveRole: CourtRole = role;
      // Admin-only preview role override, limited to Admin Profile page
      try {
        const preview = typeof window !== 'undefined' ? (localStorage.getItem('preview_role') as CourtRole | null) : null;
        const validRoles: CourtRole[] = ['admin', 'facilities_manager', 'cmc', 'court_aide', 'purchasing_staff', 'standard'];
        const onAdminProfile = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin-profile');
        if (role === 'admin' && preview && validRoles.includes(preview) && onAdminProfile) {
          logger.info('[useRolePermissions] Applying preview role override');
          effectiveRole = preview;
        } else if (role === 'admin' && preview && !onAdminProfile) {
          logger.info('[useRolePermissions] Ignoring preview role outside Admin Profile');
        }
      } catch (e) {
        // ignore preview errors
      }

      let finalPermissions = rolePermissionsMap[effectiveRole] || {
        spaces: null,
        issues: null,
        occupants: null,
        inventory: null,
        supply_requests: null,
        supply_orders: null,
        keys: null,
        lighting: null,
        maintenance: null,
        court_operations: null,
        operations: null,
        dashboard: null,
      };
      
      // Check if user is in Supply Department for permission enhancement
      const isSupplyDepartmentUser = (profileData as any)?.departments?.name === 'Supply Department';
      
      // Enhance permissions for Supply Department users
      if (isSupplyDepartmentUser) {
        finalPermissions = {
          ...finalPermissions,
          inventory: 'admin',
          supply_requests: 'admin',
          supply_orders: 'admin',
        };
        logger.debug('[useRolePermissions] Enhanced permissions for Supply Department user');
      }
      
      setUserRole(effectiveRole);
      setPermissions(finalPermissions);
      setProfile(profileData);
      
      // SECURITY FIX: Never cache admin permissions
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser && effectiveRole !== 'admin') {
          localStorage.setItem(`permissions_cache_${currentUser.id}`, JSON.stringify({
            role: effectiveRole,
            profile: profileData,
            permissions: finalPermissions,
            timestamp: Date.now()
          }));
        } else if (effectiveRole === 'admin') {
          // Clear any cached admin permissions
          localStorage.removeItem(`permissions_cache_${currentUser?.id}`);
        }
      } catch (e) {
        logger.error('[useRolePermissions] Cache write error', e);
      }
      
      const elapsed = Date.now() - startTime;
      logger.debug(`[useRolePermissions] Fetch completed in ${elapsed}ms`);
    } catch (error) {
      logger.error('[useRolePermissions] Error in fetchUserRoleAndPermissions', error);
      
      // Set fallback to standard user on error
      setUserRole('standard');
      setPermissions(rolePermissionsMap.standard);
      
      toast({
        title: "Error",
        description: "Failed to load user permissions. Using default access.",
        variant: "destructive",
      });
    } finally {
      const elapsed = Date.now() - startTime;
      logger.debug(`[useRolePermissions] Loading complete (${elapsed}ms)`);
      setLoading(false);
    }
  };

  const hasPermission = (feature: keyof RolePermissions, requiredLevel: PermissionLevel): boolean => {
    const userPermission = permissions[feature];
    if (!userPermission) return false;

    // Admin level grants all permissions
    if (userPermission === 'admin') return true;
    
    // Write level grants read permission
    if (userPermission === 'write' && requiredLevel === 'read') return true;
    
    // Exact match
    return userPermission === requiredLevel;
  };

  const canRead = (feature: keyof RolePermissions): boolean => hasPermission(feature, 'read');
  const canWrite = (feature: keyof RolePermissions): boolean => hasPermission(feature, 'write');
  const canAdmin = (feature: keyof RolePermissions): boolean => hasPermission(feature, 'admin');

  const isAdmin = userRole === 'admin';
  const isFacilitiesManager = userRole === 'facilities_manager';
  const isCMC = userRole === 'cmc';
  const isCourtAide = userRole === 'court_aide';
  const isPurchasingStaff = userRole === 'purchasing_staff';

  useEffect(() => {
    logger.debug('[useRolePermissions] Initial mount - fetching permissions');
    
    // Listen for auth state changes to reset permissions on sign out
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        logger.debug('[useRolePermissions] Sign out detected - resetting state');
        setUserRole(null);
        setProfile(null);
        setPermissions({
          spaces: null,
          issues: null,
          occupants: null,
          inventory: null,
          supply_requests: null,
          supply_orders: null,
          keys: null,
          lighting: null,
          maintenance: null,
          court_operations: null,
          operations: null,
          dashboard: null,
        });
        setLoadedFromCache(false);
        
        // Clear all permissions caches
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('permissions_cache_')) {
            localStorage.removeItem(key);
          }
        });
        localStorage.removeItem('preview_role');
      } else if (event === 'SIGNED_IN' && session) {
        logger.debug('[useRolePermissions] Sign in detected - fetching fresh permissions');
        fetchUserRoleAndPermissions(true); // Skip cache on new sign in
      }
    });
    
    // OPTIMIZATION: Reduced timeout from 5s to 3s since we now have cache
    const timeout = setTimeout(() => {
      if (loading && !loadedFromCache) {
        logger.warn('[useRolePermissions] Timeout: forcing loading=false after 3 seconds');
        setLoading(false);
        
        setUserRole('standard');
        setPermissions(rolePermissionsMap.standard);
        toast({
          title: "Loading Timeout",
          description: "Using default permissions due to slow connection",
          variant: "destructive",
        });
      }
    }, 3000);
    
    fetchUserRoleAndPermissions().finally(() => {
      clearTimeout(timeout);
    });
    
    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  // Listen for preview role changes and storage updates to refresh permissions across the app
  useEffect(() => {
    const handlePreviewChange = () => {
      fetchUserRoleAndPermissions();
    };
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'preview_role') {
        fetchUserRoleAndPermissions();
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('preview_role_changed', handlePreviewChange);
      window.addEventListener('storage', handleStorage);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('preview_role_changed', handlePreviewChange);
        window.removeEventListener('storage', handleStorage);
      }
    };
  }, []);

  return {
    userRole,
    profile,
    permissions,
    loading,
    hasPermission,
    canRead,
    canWrite,
    canAdmin,
    isAdmin,
    isFacilitiesManager,
    isCMC,
    isCourtAide,
    isPurchasingStaff,
    refetch: fetchUserRoleAndPermissions,
  };
}