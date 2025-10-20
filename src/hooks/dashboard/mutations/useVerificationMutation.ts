
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Department, SelectedUser } from "../types/verificationTypes";

export function useVerificationMutation(
  departments: Department[] | undefined,
  refetchUsers: () => void
) {
  const handleVerification = async (
    userId: string,
    approved: boolean,
    selectedDepartment: string | null
  ) => {
    try {
      if (approved) {
        const { data: profile, error: profileError } = await supabase
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
          .eq('id', userId)
          .select()
          .single();

        if (profileError) throw profileError;

        const { data: existingOccupant, error: checkError } = await supabase
          .from('occupants')
          .select('id')
          .eq('id', userId)
          .maybeSingle();

        if (checkError) throw checkError;

        if (!existingOccupant) {
          const { error: occupantError } = await supabase
            .from('occupants')
            .insert({
              id: userId,
              first_name: profile.first_name,
              last_name: profile.last_name,
              email: profile.email,
              department: departments?.find(d => d.id === selectedDepartment)?.name,
              status: 'active',
              access_level: 'standard',
              employment_type: 'full_time',
              start_date: new Date().toISOString().split('T')[0]
            });

          if (occupantError && occupantError.code !== '23505') {
            throw occupantError;
          }
        }
        
        toast.success('User approved successfully');
      } else {
        const { error: profileError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', userId);

        if (profileError) throw profileError;
        
        toast.success('User rejected and removed');
      }
      
      refetchUsers();
    } catch (error) {
      console.error('Error handling verification:', error);
      toast.error('Failed to process verification request');
      throw error;
    }
  };

  const handleBulkVerification = async (selectedUsers: SelectedUser[], approve: boolean, selectedDepartment: string | null) => {
    if (approve && !selectedDepartment) {
      toast.error('Please select a department before approving users');
      return;
    }

    try {
      if (approve) {
        for (const user of selectedUsers) {
          await handleVerification(user.userId, true, selectedDepartment);
        }
        toast.success(`${selectedUsers.length} users approved successfully`);
      } else {
        const userIds = selectedUsers.map(user => user.userId);
        
        const { error: profileError } = await supabase
          .from('profiles')
          .delete()
          .in('id', userIds);

        if (profileError) throw profileError;
        
        toast.success(`${selectedUsers.length} users rejected and removed`);
      }

      refetchUsers();
    } catch (error) {
      console.error('Error in bulk verification:', error);
      toast.error('Failed to process verification requests');
    }
  };

  return {
    handleVerification,
    handleBulkVerification
  };
}
