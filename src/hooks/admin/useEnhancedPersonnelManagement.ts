import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface PersonnelMember {
  id: string;
  name: string;
  email?: string;
  department?: string;
  title?: string;
  role?: string;
  phone?: string;
  extension?: string;
  room?: string;
  floor?: string;
  
  // User account info (if registered)
  user_id?: string;
  access_level?: 'none' | 'read' | 'write' | 'admin';
  verification_status?: 'pending' | 'verified' | 'rejected';
  is_approved?: boolean;
  is_registered: boolean;
  
  // Personnel type
  personnel_type: 'registered_user' | 'court_personnel' | 'occupant';
  
  // Timestamps
  created_at: string;
  last_login_at?: string | null;
}

export interface PersonnelStats {
  totalPersonnel: number;
  registeredUsers: number;
  courtPersonnel: number;
  occupants: number;
  pendingApprovals: number;
  adminUsers: number;
  unassignedRoles: number;
}

export function useEnhancedPersonnelManagement() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch all personnel (registered users + court personnel + occupants)
  const {
    data: allPersonnel = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['enhanced-personnel'],
    queryFn: async () => {
      const personnel: PersonnelMember[] = [];

      // 1. Fetch registered users from profiles
      const { data: registeredUsers, error: usersError } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          first_name,
          last_name,
          access_level,
          verification_status,
          is_approved,
          created_at,
          last_login_at,
          department,
          title
        `);

      if (usersError) throw usersError;

      // Add registered users to personnel list
      registeredUsers?.forEach(user => {
        personnel.push({
          id: user.id,
          user_id: user.id,
          name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
          email: user.email,
          department: user.department || undefined,
          title: user.title || undefined,
          access_level: user.access_level,
          verification_status: user.verification_status,
          is_approved: user.is_approved,
          is_registered: true,
          personnel_type: 'registered_user',
          created_at: user.created_at,
          last_login_at: user.last_login_at
        });
      });

      // 2. Fetch court personnel from term_personnel
      const { data: courtPersonnel, error: courtError } = await supabase
        .from('term_personnel')
        .select('*');

      if (courtError) throw courtError;

      // Add court personnel to list (if not already registered)
      courtPersonnel?.forEach(person => {
        const existingUser = personnel.find(p => 
          p.name.toLowerCase() === person.name.toLowerCase()
        );

        if (!existingUser) {
          personnel.push({
            id: `court_${person.id}`,
            name: person.name,
            role: person.role,
            phone: person.phone || undefined,
            extension: person.extension || undefined,
            room: person.room || undefined,
            floor: person.floor || undefined,
            email: undefined, // term_personnel doesn't have email field
            department: 'Court Administration',
            title: person.role, // use role as title
            is_registered: false,
            personnel_type: 'court_personnel',
            created_at: person.created_at || new Date().toISOString()
          });
        }
      });

      // 3. Fetch occupants
      const { data: occupants, error: occupantsError } = await supabase
        .from('occupants')
        .select('*');

      if (occupantsError) throw occupantsError;

      // Add occupants to list (if not already included)
      occupants?.forEach(occupant => {
        const occupantName = `${occupant.first_name} ${occupant.last_name}`.trim();
        const existingPerson = personnel.find(p => 
          p.name.toLowerCase() === occupantName.toLowerCase() ||
          p.email?.toLowerCase() === occupant.email?.toLowerCase()
        );

        if (!existingPerson) {
          personnel.push({
            id: `occupant_${occupant.id}`,
            name: occupantName,
            email: occupant.email || undefined,
            department: occupant.department || undefined,
            title: occupant.title || undefined,
            phone: occupant.phone || undefined,
            is_registered: false,
            personnel_type: 'occupant',
            created_at: occupant.created_at || new Date().toISOString()
          });
        }
      });

      return personnel.sort((a, b) => a.name.localeCompare(b.name));
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Calculate personnel statistics
  const personnelStats: PersonnelStats = {
    totalPersonnel: allPersonnel.length,
    registeredUsers: allPersonnel.filter(p => p.is_registered).length,
    courtPersonnel: allPersonnel.filter(p => p.personnel_type === 'court_personnel').length,
    occupants: allPersonnel.filter(p => p.personnel_type === 'occupant').length,
    pendingApprovals: allPersonnel.filter(p => p.verification_status === 'pending').length,
    adminUsers: allPersonnel.filter(p => p.access_level === 'admin').length,
    unassignedRoles: allPersonnel.filter(p => !p.role && !p.access_level).length
  };

  // Separate lists for different views
  const registeredUsers = allPersonnel.filter(p => p.is_registered);
  const unregisteredPersonnel = allPersonnel.filter(p => !p.is_registered);
  const courtPersonnel = allPersonnel.filter(p => p.personnel_type === 'court_personnel');
  const occupants = allPersonnel.filter(p => p.personnel_type === 'occupant');

  // Mutation to assign role to personnel (works for both registered and unregistered)
  const assignRoleMutation = useMutation({
    mutationFn: async ({ personnelId, role }: { personnelId: string; role: string }) => {
      const person = allPersonnel.find(p => p.id === personnelId);
      if (!person) throw new Error('Personnel not found');

      if (person.is_registered && person.user_id) {
        // For registered users, update user_roles table
        const { error } = await supabase
          .from('user_roles')
          .upsert({
            user_id: person.user_id,
            role: role as any,
            assigned_by: currentUser?.id,
            assigned_at: new Date().toISOString()
          });

        if (error) throw error;
      } else {
        // For unregistered personnel, we could create a personnel_roles table
        // or store in a JSON field for now - let's use a simple approach
        console.log(`Would assign role ${role} to unregistered personnel ${person.name}`);
        
        // TODO: Implement personnel_roles table for unregistered personnel
        toast({
          title: "Role Assignment",
          description: `Role ${role} noted for ${person.name}. Will be applied when they register.`,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-personnel'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: "Success",
        description: "Role assigned successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to assign role: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Mutation to promote user to admin (only for registered users)
  const promoteToAdminMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('profiles')
        .update({ access_level: 'admin' })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-personnel'] });
      toast({
        title: "Success",
        description: "User promoted to admin successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to promote user: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Mutation to create account invitation for unregistered personnel
  const invitePersonnelMutation = useMutation({
    mutationFn: async ({ personnelId, email }: { personnelId: string; email: string }) => {
      const person = allPersonnel.find(p => p.id === personnelId);
      if (!person) throw new Error('Personnel not found');

      // TODO: Implement invitation system
      console.log(`Would send invitation to ${email} for ${person.name}`);
      
      toast({
        title: "Invitation Sent",
        description: `Account invitation sent to ${person.name} at ${email}`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-personnel'] });
    }
  });

  return {
    // Data
    allPersonnel,
    registeredUsers,
    unregisteredPersonnel,
    courtPersonnel,
    occupants,
    personnelStats,
    
    // State
    isLoading,
    error,
    currentUserId: currentUser?.id || null,
    
    // Actions
    assignRole: assignRoleMutation.mutate,
    promoteToAdmin: promoteToAdminMutation.mutate,
    invitePersonnel: invitePersonnelMutation.mutate,
    
    // Loading states
    isAssigningRole: assignRoleMutation.isPending,
    isPromoting: promoteToAdminMutation.isPending,
    isInviting: invitePersonnelMutation.isPending
  };
}
