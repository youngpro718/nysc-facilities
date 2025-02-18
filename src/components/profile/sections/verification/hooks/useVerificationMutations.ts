
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useVerificationMutations = () => {
  const queryClient = useQueryClient();

  const sendVerificationEmail = async (type: string, userId: string, adminNotes?: string) => {
    try {
      const { error } = await supabase.functions.invoke('send-verification-email', {
        body: { type, userId, adminNotes }
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('Error sending verification email:', error);
      throw error;
    }
  };

  const handleVerification = useMutation({
    mutationFn: async ({ 
      userId, 
      approved, 
      adminNotes 
    }: { 
      userId: string; 
      approved: boolean; 
      adminNotes?: string;
    }) => {
      try {
        if (approved) {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ 
              verification_status: 'verified',
              is_approved: true,
              updated_at: new Date().toISOString()
            })
            .eq('id', userId);

          if (updateError) throw updateError;

          // Update verification request status
          const { error: requestError } = await supabase
            .from('verification_requests')
            .update({
              status: 'approved',
              processed_by: (await supabase.auth.getUser()).data.user?.id,
              processed_at: new Date().toISOString(),
              notes: adminNotes
            })
            .eq('user_id', userId);

          if (requestError) throw requestError;

          // Send approval email
          await sendVerificationEmail('approved', userId);
        } else {
          // Handle rejection
          const { error: rejectError } = await supabase
            .from('verification_requests')
            .update({
              status: 'rejected',
              processed_by: (await supabase.auth.getUser()).data.user?.id,
              processed_at: new Date().toISOString(),
              notes: adminNotes
            })
            .eq('user_id', userId);

          if (rejectError) throw rejectError;

          // Send rejection email
          await sendVerificationEmail('rejected', userId, adminNotes);

          // Delete the user's profile
          const { error: deleteError } = await supabase
            .from('profiles')
            .delete()
            .eq('id', userId);

          if (deleteError) throw deleteError;
        }
      } catch (error: any) {
        console.error('Error in verification process:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verification-requests'] });
      toast.success('Verification status updated successfully');
    },
    onError: (error: Error) => {
      console.error('Verification error:', error);
      toast.error('Failed to update verification status');
    }
  });

  const handleBulkVerification = useMutation({
    mutationFn: async ({ 
      userIds, 
      approved, 
      departmentId,
      adminNotes 
    }: { 
      userIds: string[]; 
      approved: boolean;
      departmentId?: string;
      adminNotes?: string;
    }) => {
      for (const userId of userIds) {
        try {
          if (approved) {
            // Update profile
            const { error: updateError } = await supabase
              .from('profiles')
              .update({ 
                verification_status: 'verified',
                is_approved: true,
                department_id: departmentId,
                updated_at: new Date().toISOString()
              })
              .eq('id', userId);

            if (updateError) throw updateError;

            // Update verification request
            const { error: requestError } = await supabase
              .from('verification_requests')
              .update({
                status: 'approved',
                processed_by: (await supabase.auth.getUser()).data.user?.id,
                processed_at: new Date().toISOString(),
                notes: adminNotes
              })
              .eq('user_id', userId);

            if (requestError) throw requestError;

            // Send approval email
            await sendVerificationEmail('approved', userId);
          } else {
            // Handle rejection
            const { error: rejectError } = await supabase
              .from('verification_requests')
              .update({
                status: 'rejected',
                processed_by: (await supabase.auth.getUser()).data.user?.id,
                processed_at: new Date().toISOString(),
                notes: adminNotes
              })
              .eq('user_id', userId);

            if (rejectError) throw rejectError;

            // Send rejection email
            await sendVerificationEmail('rejected', userId, adminNotes);

            // Delete the user's profile
            const { error: deleteError } = await supabase
              .from('profiles')
              .delete()
              .eq('id', userId);

            if (deleteError) throw deleteError;
          }
        } catch (error: any) {
          console.error(`Error processing user ${userId}:`, error);
          throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verification-requests'] });
      toast.success('Bulk verification completed successfully');
    },
    onError: (error: Error) => {
      console.error('Bulk verification error:', error);
      toast.error('Failed to complete bulk verification');
    }
  });

  return {
    handleVerification,
    handleBulkVerification
  };
};
