import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type CourtRole = 
  | 'judge'
  | 'court_aide' 
  | 'clerk'
  | 'sergeant'
  | 'court_officer'
  | 'bailiff'
  | 'court_reporter'
  | 'administrative_assistant'
  | 'facilities_manager'
  | 'admin';

export type PermissionLevel = 'read' | 'write' | 'admin';

export interface RolePermissions {
  spaces: PermissionLevel | null;
  issues: PermissionLevel | null;
  occupants: PermissionLevel | null;
  inventory: PermissionLevel | null;
  supply_requests: PermissionLevel | null;
  keys: PermissionLevel | null;
  lighting: PermissionLevel | null;
  maintenance: PermissionLevel | null;
  court_operations: PermissionLevel | null;
  dashboard: PermissionLevel | null;
}

export function useRolePermissions() {
  const [userRole, setUserRole] = useState<CourtRole | null>(null);
  const [permissions, setPermissions] = useState<RolePermissions>({
    spaces: null,
    issues: null,
    occupants: null,
    inventory: null,
    supply_requests: null,
    keys: null,
    lighting: null,
    maintenance: null,
    court_operations: null,
    dashboard: null,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUserRoleAndPermissions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (roleError) {
        console.error('Error fetching user role:', roleError);
        return;
      }

      const role = roleData?.role as CourtRole;
      setUserRole(role);

      // Define role permissions mapping based on court roles
      const rolePermissionsMap: Record<CourtRole, RolePermissions> = {
        judge: {
          spaces: null,
          issues: 'write',
          occupants: null,
          inventory: null,
          supply_requests: 'write',
          keys: 'write',
          lighting: null,
          maintenance: null,
          court_operations: null,
          dashboard: 'read',
        },
        court_aide: {
          spaces: 'read',
          issues: 'write',
          occupants: 'read',
          inventory: 'admin',
          supply_requests: 'admin',
          keys: 'read',
          lighting: null,
          maintenance: null,
          court_operations: null,
          dashboard: 'read',
        },
        clerk: {
          spaces: null,
          issues: 'write',
          occupants: 'read',
          inventory: null,
          supply_requests: 'write',
          keys: 'write',
          lighting: null,
          maintenance: null,
          court_operations: null,
          dashboard: 'read',
        },
        sergeant: {
          spaces: 'read',
          issues: 'write',
          occupants: 'read',
          inventory: null,
          supply_requests: null,
          keys: 'admin',
          lighting: null,
          maintenance: null,
          court_operations: null,
          dashboard: 'read',
        },
        court_officer: {
          spaces: null,
          issues: 'write',
          occupants: 'read',
          inventory: null,
          supply_requests: null,
          keys: 'write',
          lighting: null,
          maintenance: null,
          court_operations: null,
          dashboard: 'read',
        },
        bailiff: {
          spaces: null,
          issues: 'write',
          occupants: 'read',
          inventory: null,
          supply_requests: 'write',
          keys: 'write',
          lighting: null,
          maintenance: null,
          court_operations: null,
          dashboard: 'read',
        },
        court_reporter: {
          spaces: null,
          issues: 'write',
          occupants: null,
          inventory: null,
          supply_requests: 'write',
          keys: null,
          lighting: null,
          maintenance: null,
          court_operations: null,
          dashboard: 'read',
        },
        administrative_assistant: {
          spaces: null,
          issues: 'write',
          occupants: 'admin',
          inventory: null,
          supply_requests: 'write',
          keys: 'write',
          lighting: null,
          maintenance: null,
          court_operations: null,
          dashboard: 'read',
        },
        facilities_manager: {
          spaces: 'admin',
          issues: 'admin',
          occupants: 'admin',
          inventory: 'write',
          supply_requests: 'write',
          keys: 'admin',
          lighting: 'admin',
          maintenance: 'admin',
          court_operations: null,
          dashboard: 'admin',
        },
        admin: {
          spaces: 'admin',
          issues: 'admin',
          occupants: 'admin',
          inventory: 'admin',
          supply_requests: 'admin',
          keys: 'admin',
          lighting: 'admin',
          maintenance: 'admin',
          court_operations: 'admin',
          dashboard: 'admin',
        },
      };

      setPermissions(rolePermissionsMap[role] || {
        spaces: null,
        issues: null,
        occupants: null,
        inventory: null,
        supply_requests: null,
        keys: null,
        lighting: null,
        maintenance: null,
        court_operations: null,
        dashboard: null,
      });
    } catch (error) {
      console.error('Error in fetchUserRoleAndPermissions:', error);
      toast({
        title: "Error",
        description: "Failed to load user permissions",
        variant: "destructive",
      });
    } finally {
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
  const isCourtAide = userRole === 'court_aide';
  const isJudge = userRole === 'judge';

  useEffect(() => {
    fetchUserRoleAndPermissions();
  }, []);

  return {
    userRole,
    permissions,
    loading,
    hasPermission,
    canRead,
    canWrite,
    canAdmin,
    isAdmin,
    isFacilitiesManager,
    isCourtAide,
    isJudge,
    refetch: fetchUserRoleAndPermissions,
  };
}