
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Department, UserVerificationView, VerificationRequest, VerificationStatus, RequestStatus } from "./types";

export function useVerificationQueries() {
  const { data: departments, isLoading: isLoadingDepartments } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Department[];
    }
  });

  const { 
    data: users, 
    isLoading: isLoadingUsers, 
    refetch: refetchUsers 
  } = useQuery({
    queryKey: ['users-verification'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_verification_view')
        .select('*')
        .returns<UserVerificationView[]>();

      if (error) throw error;
      return data;
    }
  });

  // Query to get admin roles
  const { data: adminRoles } = useQuery({
    queryKey: ['admin-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');
      
      if (error) throw error;
      return data.map(role => role.user_id);
    }
  });

  const mapVerificationStatusToRequestStatus = (status: VerificationStatus): RequestStatus => {
    switch (status) {
      case 'verified':
        return 'approved';
      case 'rejected':
        return 'rejected';
      default:
        return 'pending';
    }
  };

  const verificationRequests: VerificationRequest[] = users?.map(user => ({
    id: user.id,
    user_id: user.id,
    department_id: user.department_id,
    status: mapVerificationStatusToRequestStatus(user.verification_status || 'pending'),
    submitted_at: user.created_at,
    profile: {
      id: user.profile_id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      verification_status: user.verification_status || 'pending',
      department_id: user.department_id
    },
    is_admin: adminRoles?.includes(user.id) || false
  })) || [];

  return {
    departments,
    users,
    verificationRequests,
    isLoading: isLoadingDepartments || isLoadingUsers,
    refetchUsers
  };
}
