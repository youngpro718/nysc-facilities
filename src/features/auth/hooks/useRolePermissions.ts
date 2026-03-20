import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@shared/hooks/use-toast';
import { logger } from '@/lib/logger';
import { useAuth } from '@features/auth/hooks/useAuth';

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
  maintenance: PermissionLevel | null;
  court_operations: PermissionLevel | null;
  operations: PermissionLevel | null;
  dashboard: PermissionLevel | null;
  lighting: PermissionLevel | null;
}

export function useRolePermissions() {
  const { profile: authProfile, isLoading: authLoading } = useAuth();
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
    maintenance: null,
    court_operations: null,
    operations: null,
    dashboard: null,
    lighting: null,
  });
  const [loading, setLoading] = useState(true);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Guard to prevent concurrent fetches
  const isFetchingRef = useRef(false);
  const hasFetchedRef = useRef(false);
  const canPreviewRole = import.meta.env.DEV;
  
  // Define role permissions mapping
  const rolePermissionsMap: Record<CourtRole, RolePermissions> = {
    system_admin: {
      spaces: 'admin',
      issues: 'admin',
      occupants: 'admin',
      inventory: 'admin',
      supply_requests: 'admin',
      supply_orders: 'admin',
      keys: 'admin',
      maintenance: 'admin',
      court_operations: 'admin',
      operations: 'admin',
      dashboard: 'admin',
      lighting: 'admin',
    },
    admin: {
      spaces: 'admin',
      issues: 'admin',
      occupants: 'admin',
      inventory: 'admin',
      supply_requests: 'admin',
      supply_orders: 'admin',
      keys: 'admin',
      maintenance: 'admin',
      court_operations: 'admin',
      operations: 'admin',
      dashboard: 'admin',
      lighting: 'admin',
    },
    facilities_manager: {
      spaces: 'admin',
      issues: 'admin',
      occupants: 'admin',
      inventory: 'admin',
      supply_requests: 'admin',
      supply_orders: 'admin',
      keys: 'admin',
      maintenance: 'admin',
      court_operations: 'read',
      operations: 'admin',
      dashboard: 'admin',
      lighting: 'admin',
    },
    cmc: {
      spaces: null,
      issues: 'write',
      occupants: 'read',
      inventory: null,
      supply_requests: 'write',
      supply_orders: null,
      keys: 'write',
      maintenance: null,
      court_operations: 'write',
      operations: 'write',
      dashboard: 'read',
      lighting: null,
    },
    court_aide: {
      spaces: null,
      issues: 'write',
      occupants: 'read',
      inventory: 'admin',
      supply_requests: 'write',
      supply_orders: 'admin',
      keys: null,
      maintenance: null,
      court_operations: null,
      operations: 'read',
      dashboard: 'read',
      lighting: null,
    },
    purchasing: {
      spaces: null,
      issues: 'read',
      occupants: null,
      inventory: 'read',
      supply_requests: 'read',
      supply_orders: 'read',
      keys: null,
      maintenance: null,
      court_operations: null,
      operations: 'read',
      dashboard: 'read',
      lighting: null,
    },
    court_officer: {
      spaces: 'read',
      issues: 'write',
      occupants: null,
      inventory: null,
      supply_requests: null,
      supply_orders: null,
      keys: 'write',
      maintenance: null,
      court_operations: null,
      operations: null,
      dashboard: 'read',
      lighting: 'write',
    },
    standard: {
      spaces: null,
      issues: 'write',
      occupants: null,
      inventory: null,
      supply_requests: 'write',
      supply_orders: null,
      keys: null,
      maintenance: null,
      court_operations: null,
      operations: null,
      dashboard: 'read',
      lighting: null,
    },
  };

  const ROLE_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  const getRoleCacheKey = (userId: string) => `role_ctx_${userId}`;

  const readRoleCache = (userId: string) => {
    try {
      const raw = sessionStorage.getItem(getRoleCacheKey(userId));
      if (!raw) return null;
      const { role, profileData, cachedAt } = JSON.parse(raw);
      if (Date.now() - cachedAt > ROLE_CACHE_TTL_MS) {
        sessionStorage.removeItem(getRoleCacheKey(userId));
        return null;
      }
      return { role, profileData } as { role: CourtRole; profileData: Record<string, unknown> | null };
    } catch {
      return null;
    }
  };

  const writeRoleCache = (userId: string, role: CourtRole, profileData: Record<string, unknown> | null) => {
    try {
      sessionStorage.setItem(getRoleCacheKey(userId), JSON.stringify({ role, profileData, cachedAt: Date.now() }));
    } catch {
      // sessionStorage quota exceeded or unavailable — ignore
    }
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

      // Check sessionStorage cache before hitting the DB
      const cached = readRoleCache(user.id);
      if (cached) {
        logger.debug('[useRolePermissions] Role resolved from sessionStorage cache');
        let effectiveRole: CourtRole = cached.role;
        try {
          const preview = canPreviewRole && typeof window !== 'undefined' ? (localStorage.getItem('preview_role') as CourtRole | null) : null;
          const validRoles: CourtRole[] = ['admin', 'system_admin', 'facilities_manager', 'cmc', 'court_officer', 'purchasing', 'court_aide', 'standard'];
          if ((cached.role === 'admin' || cached.role === 'system_admin') && preview && validRoles.includes(preview)) {
            effectiveRole = preview;
          }
        } catch { /* ignore */ }
        setUserRole(effectiveRole);
        setPermissions(rolePermissionsMap[effectiveRole] || rolePermissionsMap.standard);
        setProfile(cached.profileData);
        setPermissionError(null);
        setLoading(false);
        hasFetchedRef.current = true;
        isFetchingRef.current = false;
        return;
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
        logger.warn('[useRolePermissions] Direct user_roles read failed (RLS), trying RPC fallback', roleQuery.error);
      }

      let role = (roleQuery.data?.role as CourtRole | null) || null;
      const profileData = profileQuery.data;

      if (!role) {
        // Fallback to secure RPC that bypasses RLS
        try {
          logger.debug('[useRolePermissions] Attempting RPC fallback');
          const { data: secureRole, error: rpcError } = await supabase.rpc('get_current_user_role');
          if (rpcError) {
            logger.warn('[useRolePermissions] RPC fallback also failed', rpcError);
          } else if (secureRole) {
            role = secureRole as CourtRole;
            logger.debug('[useRolePermissions] Role from secure RPC');
          }
        } catch (error) {
          logger.warn('[useRolePermissions] Exception calling get_current_user_role', error);
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
        const preview = canPreviewRole && typeof window !== 'undefined' ? (localStorage.getItem('preview_role') as CourtRole | null) : null;
        const validRoles: CourtRole[] = ['admin', 'system_admin', 'facilities_manager', 'cmc', 'court_officer', 'purchasing', 'court_aide', 'standard'];
        if ((role === 'admin' || role === 'system_admin') && preview && validRoles.includes(preview)) {
          logger.info('[useRolePermissions] Applying preview role override (Dev Mode)');
          effectiveRole = preview;
        }
      } catch (error) {
        // ignore preview errors
      }

      // Get permissions from role map, or fall back to standard user permissions
      // SECURITY: Department names are user-editable and must NOT grant permissions
      const finalPermissions = rolePermissionsMap[effectiveRole] || rolePermissionsMap.standard;
      
      // Log warning if role not found in permission map
      if (!rolePermissionsMap[effectiveRole]) {
        logger.warn(`[useRolePermissions] Role "${effectiveRole}" not found in permission map, falling back to standard permissions`);
      }
      setUserRole(effectiveRole);
      setPermissions(finalPermissions);
      setProfile(profileData);
      setPermissionError(null);

      // Cache the resolved role so subsequent mounts skip DB calls
      writeRoleCache(user.id, role, profileData as Record<string, unknown> | null);

      const elapsed = Date.now() - startTime;
      logger.debug(`[useRolePermissions] Fetch completed in ${elapsed}ms`);
      hasFetchedRef.current = true;
    } catch (error) {
      logger.warn('[useRolePermissions] Error in fetchUserRoleAndPermissions', error);
      
      // Set fallback to standard user on error
      setUserRole(null);
      setPermissions(rolePermissionsMap.standard);
      setPermissionError('Permissions failed to load. Please retry.');
      
      toast({
        title: "Error",
        description: "Failed to load user permissions.",
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

  const isAdmin = userRole === 'admin' || userRole === 'system_admin';
  const isSystemAdmin = userRole === 'admin' || userRole === 'system_admin';
  const isFacilitiesManager = userRole === 'facilities_manager';
  const isCMC = userRole === 'cmc';
  const isCourtAide = userRole === 'court_aide';
  const isPurchasing = userRole === 'purchasing';
  const isPurchasingStaff = userRole === 'purchasing';

  // Fast-path: if useAuth already resolved the profile/role, apply permissions immediately
  // without making additional DB calls.
  useEffect(() => {
    if (authLoading || hasFetchedRef.current) return;
    const role = authProfile?.role as CourtRole | undefined;
    if (!role) return;

    logger.debug('[useRolePermissions] Fast-path: applying role from auth context:', role);

    let effectiveRole: CourtRole = rolePermissionsMap[role] ? role : 'standard';
    try {
      const preview = canPreviewRole && typeof window !== 'undefined' ? (localStorage.getItem('preview_role') as CourtRole | null) : null;
      const validRoles: CourtRole[] = ['admin', 'system_admin', 'facilities_manager', 'cmc', 'court_officer', 'purchasing', 'court_aide', 'standard'];
      if ((role === 'admin' || role === 'system_admin') && preview && validRoles.includes(preview)) {
        effectiveRole = preview;
      }
    } catch (_) { /* ignore */ }

    setUserRole(effectiveRole);
    setPermissions(rolePermissionsMap[effectiveRole] || rolePermissionsMap.standard);
    setProfile(authProfile as unknown as Record<string, unknown>);
    setLoading(false);
    hasFetchedRef.current = true;
  }, [authProfile, authLoading]);

  useEffect(() => {
    logger.debug('[useRolePermissions] Initial mount - setting up');
    
    // Listen for auth state changes to reset permissions on sign out
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        logger.debug('[useRolePermissions] Sign out detected - resetting state');
        // Clear cached role so the next user on this device starts fresh
        try {
          const keys = Object.keys(sessionStorage).filter(k => k.startsWith('role_ctx_'));
          keys.forEach(k => sessionStorage.removeItem(k));
        } catch { /* ignore */ }
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
          maintenance: null,
          court_operations: null,
          operations: null,
          dashboard: null,
          lighting: null,
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
        setUserRole(null);
        setPermissions(rolePermissionsMap.standard);
        setPermissionError('Permissions failed to load. Please retry.');
        toast({
          title: "Loading Timeout",
          description: "Permissions failed to load. Please retry.",
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
    isSystemAdmin,
    isFacilitiesManager,
    isCMC,
    isCourtAide,
    isPurchasing,
    isPurchasingStaff,
    permissionError,
    refetch: fetchUserRoleAndPermissions,
  };
}