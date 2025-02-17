import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type VerificationStatus = 'pending' | 'verified' | 'rejected';
export type RequestStatus = 'pending' | 'approved' | 'rejected';

export interface Profile {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  verification_status: VerificationStatus;
  department_id: string | null;
}

export interface UserVerificationView {
  id: string;
  department_name: string | null;
  created_at: string;
  updated_at: string;
  profile_id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  verification_status: VerificationStatus;
  department_id: string | null;
}

export interface VerificationRequest {
  id: string;
  user_id: string;
  department_id: string | null;
  status: RequestStatus;
  submitted_at: string;
  profile: Profile | null;
}

export function useVerification() {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  const { data: users, isLoading, refetch } = useQuery({
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

  const handleVerification = async (userId: string, approved: boolean) => {
    try {
      if (approved) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            verification_status: 'verified',
            department_id: selectedDepartment,
            metadata: {
              employment_type: 'full_time',
              access_level: 'standard',
              start_date: new Date().toISOString().split('T')[0]
            }
          })
          .eq('id', userId);

        if (profileError) throw profileError;
        
        toast.success('User approved successfully');
      } else {
        // Delete from both profiles and users_metadata tables
        const { error: metadataError } = await supabase
          .from('users_metadata')
          .delete()
          .eq('id', userId);

        if (metadataError) throw metadataError;

        const { error: profileError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', userId);

        if (profileError) throw profileError;
        
        toast.success('User rejected and removed');
      }
      
      refetch();
    } catch (error) {
      console.error('Error handling verification:', error);
      toast.error('Failed to process verification request');
    }
  };

  const handleBulkVerification = async (approve: boolean) => {
    if (approve && !selectedDepartment) {
      toast.error('Please select a department before approving users');
      return;
    }

    try {
      if (approve) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            verification_status: 'verified',
            department_id: selectedDepartment,
            metadata: {
              employment_type: 'full_time',
              access_level: 'standard',
              start_date: new Date().toISOString().split('T')[0]
            }
          })
          .in('id', selectedUsers);

        if (profileError) throw profileError;
        
        toast.success(`${selectedUsers.length} users approved successfully`);
      } else {
        // Delete from both profiles and users_metadata tables
        const { error: metadataError } = await supabase
          .from('users_metadata')
          .delete()
          .in('id', selectedUsers);

        if (metadataError) throw metadataError;

        const { error: profileError } = await supabase
          .from('profiles')
          .delete()
          .in('id', selectedUsers);

        if (profileError) throw profileError;
        
        toast.success(`${selectedUsers.length} users rejected and removed`);
      }

      setSelectedUsers([]);
      refetch();
    } catch (error) {
      console.error('Error in bulk verification:', error);
      toast.error('Failed to process verification requests');
    }
  };

  const handleToggleAdmin = async (userId: string, isAdmin: boolean) => {
    try {
      if (isAdmin) {
        // Add user to admin role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: userId,
            role: 'admin'
          });

        if (roleError) throw roleError;
      } else {
        // Remove admin role
        const { error: roleError } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'admin');

        if (roleError) throw roleError;
      }
      
      refetch();
    } catch (error) {
      console.error('Error toggling admin status:', error);
      toast.error('Failed to update admin status');
    }
  };

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
    }
  })) || [];

  return {
    selectedUsers,
    setSelectedUsers,
    selectedDepartment,
    setSelectedDepartment,
    departments,
    users,
    isLoading,
    verificationRequests,
    handleVerification,
    handleBulkVerification,
    handleToggleAdmin
  };
}
