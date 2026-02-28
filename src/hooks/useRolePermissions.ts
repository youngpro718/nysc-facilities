import { useState, useEffect, useRef } from 'react';
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
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
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
  
  // Guard to prevent concurrent fetches
  const isFetchingRef = useRef(false);
  const hasFetchedRef = useRef(false);
  
  // Define role permissions mapping - 4 SIMPLIFIED ROLES
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
    court_officer: {
      spaces: 'read',
      issues: null,
      occupants: null,
      inventory: null,
      supply_requests: null,
      supply_orders: null,
      keys: 'write',
      lighting: null,
      maintenance: null,
      court_operations: null,
      operations: null,
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

  const fetchUserRoleAndPermissions = async () => {
    const startTime = Date.now();
    
    // Guard against concurrent fetches
    if (isFetchingRef.current) {
      logger.debug('[useRolePermissions] Fetch already in progress, skipping');
      return;
    }
    
    isFetchingRef.current = true;
    logger.debug('[useRolePermissions] Fetch started');
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        logger.debug('[useRolePermissions] No user found');
        isFetchingRef.current = false;
        return;
      }

      logger.debug('[useRolePermissions] User authenticated');

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
      
      logger.debug('[useRolePermissions] Final role before preview');
      setProfile(profileData);

      // rolePermissionsMap moved above

      let effectiveRole: CourtRole = role;
      // Admin-only preview role override - now works site-wide for Dev Mode
      try {
        const preview = typeof window !== 'undefined' ? (localStorage.getItem('preview_role') as CourtRole | null) : null;
        const validRoles: CourtRole[] = ['admin', 'cmc', 'court_officer', 'court_aide', 'standard'];
        if (role === 'admin' && preview && validRoles.includes(preview)) {
          logger.info('[useRolePermissions] Applying preview role override (Dev Mode)');
          effectiveRole = preview;
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
      
      // Supply permissions are granted via the user_roles table (court_aide role).
      // Department name must not be used to elevate permissions.
      setUserRole(effectiveRole);
      setPermissions(finalPermissions);
      setProfile(profileData);

      const elapsed = Date.now() - startTime;
      logger.debug(`[useRolePermissions] Fetch completed in ${elapsed}ms`);
      hasFetchedRef.current = true;
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
      isFetchingRef.current = false;
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
  const isCMC = userRole === 'cmc';
  const isCourtAide = userRole === 'court_aide';
  // Legacy compatibility - map deprecated roles to current ones
  const isFacilitiesManager = userRole === 'admin'; // Facilities manager now maps to admin
  const isPurchasingStaff = userRole === 'court_aide'; // Purchasing staff now maps to court_aide

  useEffect(() => {
    logger.debug('[useRolePermissions] Initial mount - setting up');
    
    // Listen for auth state changes to reset permissions on sign out
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        logger.debug('[useRolePermissions] Sign out detected - resetting state');
        hasFetchedRef.current = false;
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
        localStorage.removeItem('preview_role');
      } else if (event === 'SIGNED_IN' && session) {
        // Don't refetch here - let useAuth handle it
        logger.debug('[useRolePermissions] Sign in detected - skipping refetch (handled by useAuth)');
      }
    });
    
    // OPTIMIZATION: Reduced timeout from 5s to 3s since we now have cache
    const timeout = setTimeout(() => {
      if (loading) {
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
    
    // Only fetch if we haven't already fetched
    if (!hasFetchedRef.current) {
      logger.debug('[useRolePermissions] Fetching permissions for first time');
      fetchUserRoleAndPermissions().finally(() => {
        clearTimeout(timeout);
      });
    } else {
      logger.debug('[useRolePermissions] Skipping fetch - already completed');
      clearTimeout(timeout);
    }
    
    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  // Listen for preview role changes and storage updates to refresh permissions across the app
  useEffect(() => {
    const handlePreviewChange = () => {
      logger.debug('[useRolePermissions] Preview role changed event triggered');
      fetchUserRoleAndPermissions();
    };
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'preview_role') {
        logger.debug('[useRolePermissions] Storage event for preview_role');
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