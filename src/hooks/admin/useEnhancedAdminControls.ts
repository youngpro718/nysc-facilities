import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export interface AdminActionResult {
  success: boolean;
  message: string;
}

export function useEnhancedAdminControls() {
  const fixUserAccount = async (userId: string): Promise<AdminActionResult> => {
    try {
      const { data, error } = await supabase.rpc('admin_fix_user_account', {
        target_user_id: userId
      });

      if (error) throw error;

      const result = data as AdminActionResult;
      
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }

      return result;
    } catch (error) {
      console.error('Error fixing user account:', error);
      toast.error('Failed to fix user account');
      return { success: false, message: 'Failed to fix user account' };
    }
  };

  const suspendUser = async (userId: string, reason?: string): Promise<AdminActionResult> => {
    try {
      const { data, error } = await supabase.rpc('admin_suspend_user', {
        target_user_id: userId,
        p_reason: reason
      });

      if (error) throw error;

      const result = data as AdminActionResult;
      
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }

      return result;
    } catch (error) {
      console.error('Error suspending user:', error);
      toast.error('Failed to suspend user');
      return { success: false, message: 'Failed to suspend user' };
    }
  };

  const unsuspendUser = async (userId: string): Promise<AdminActionResult> => {
    try {
      const { data, error } = await supabase.rpc('admin_unsuspend_user', {
        target_user_id: userId
      });

      if (error) throw error;

      const result = data as AdminActionResult;
      
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }

      return result;
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
    }
  ): Promise<AdminActionResult> => {
    try {
      const { data, error } = await supabase.rpc('admin_update_user_profile', {
        target_user_id: userId,
        p_first_name: updates.first_name,
        p_last_name: updates.last_name,
        p_email: updates.email,
        p_department_id: updates.department_id,
        p_title: updates.title,
        p_access_level: updates.access_level
      });

      if (error) throw error;

      const result = data as AdminActionResult;
      
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }

      return result;
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
      const { data, error } = await supabase.rpc('admin_override_verification', {
        target_user_id: userId,
        p_verification_status: verificationStatus,
        p_is_approved: isApproved,
        p_access_level: accessLevel
      });

      if (error) throw error;

      const result = data as AdminActionResult;
      
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }

      return result;
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
