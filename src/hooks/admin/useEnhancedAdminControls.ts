import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export interface AdminActionResult {
  success: boolean;
  message: string;
}

export function useEnhancedAdminControls() {
  const fixUserAccount = async (userId: string): Promise<AdminActionResult> => {
    try {
      // Fix common account issues: verify and approve user
      const { error } = await supabase
        .from('profiles')
        .update({ 
          verification_status: 'verified',
          is_approved: true
        })
        .eq('id', userId);

      if (error) throw error;

      toast.success('User account fixed successfully');
      return { success: true, message: 'User account fixed successfully' };
    } catch (error) {
      console.error('Error fixing user account:', error);
      toast.error('Failed to fix user account');
      return { success: false, message: 'Failed to fix user account' };
    }
  };

  const suspendUser = async (userId: string, reason?: string): Promise<AdminActionResult> => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_suspended: true,
          suspension_reason: reason,
          suspended_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      toast.success('User suspended successfully');
      return { success: true, message: 'User suspended successfully' };
    } catch (error) {
      console.error('Error suspending user:', error);
      toast.error('Failed to suspend user');
      return { success: false, message: 'Failed to suspend user' };
    }
  };

  const unsuspendUser = async (userId: string): Promise<AdminActionResult> => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_suspended: false,
          suspension_reason: null,
          suspended_at: null
        })
        .eq('id', userId);

      if (error) throw error;

      toast.success('User unsuspended successfully');
      return { success: true, message: 'User unsuspended successfully' };
    } catch (error) {
      console.error('Error unsuspending user:', error);
      toast.error('Failed to unsuspend user');
      return { success: false, message: 'Failed to unsuspend user' };
    }
  };

  const updateUserProfile = async (
    userId: string,
    updates: {
      first_name?: string;
      last_name?: string;
      email?: string;
      department_id?: string;
      title?: string;
      access_level?: string;
      role?: string;
    }
  ): Promise<AdminActionResult> => {
    try {
      // Separate role updates from profile updates
      const { role, ...profileUpdates } = updates;
      
      // Update role via RPC function if role is being changed
      if (role) {
        const { error: roleError } = await supabase.rpc('admin_update_user_role', {
          target_user_id: userId,
          new_role: role
        });
        
        if (roleError) {
          console.error('Error updating user role:', roleError);
          toast.error('Failed to update user role');
          return { success: false, message: 'Failed to update user role' };
        }
      }
      
      // Update other profile fields if any
      if (Object.keys(profileUpdates).length > 0) {
        // Filter out undefined values
        const cleanUpdates = Object.fromEntries(
          Object.entries(profileUpdates).filter(([_, v]) => v !== undefined)
        );

        const { error } = await supabase
          .from('profiles')
          .update(cleanUpdates)
          .eq('id', userId);

        if (error) throw error;
      }

      toast.success('User profile updated successfully');
      return { success: true, message: 'User profile updated successfully' };
    } catch (error) {
      console.error('Error updating user profile:', error);
      toast.error('Failed to update user profile');
      return { success: false, message: 'Failed to update user profile' };
    }
  };

  const overrideVerification = async (
    userId: string,
    verificationStatus: 'pending' | 'verified' | 'rejected',
    isApproved?: boolean,
    accessLevel?: string
  ): Promise<AdminActionResult> => {
    try {
      const updates: any = {
        verification_status: verificationStatus
      };
      
      if (isApproved !== undefined) {
        updates.is_approved = isApproved;
      }
      
      if (accessLevel) {
        updates.access_level = accessLevel;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (error) throw error;

      toast.success('Verification status updated successfully');
      return { success: true, message: 'Verification status updated successfully' };
    } catch (error) {
      console.error('Error overriding verification:', error);
      toast.error('Failed to override verification');
      return { success: false, message: 'Failed to override verification' };
    }
  };

  const sendPasswordReset = async (email: string): Promise<AdminActionResult> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) throw error;

      toast.success('Password reset email sent');
      return { success: true, message: 'Password reset email sent' };
    } catch (error) {
      console.error('Error sending password reset:', error);
      toast.error('Failed to send password reset email');
      return { success: false, message: 'Failed to send password reset email' };
    }
  };

  return {
    fixUserAccount,
    suspendUser,
    unsuspendUser,
    updateUserProfile,
    overrideVerification,
    sendPasswordReset
  };
}
