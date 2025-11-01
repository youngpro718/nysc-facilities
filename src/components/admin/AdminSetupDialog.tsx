import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

interface AdminSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const AdminSetupDialog: React.FC<AdminSetupDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSetupAdmin = async () => {
    if (!email.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('setup_emergency_admin', { 
        user_email: email.trim().toLowerCase() 
      });

      if (error) {
        throw error;
      }

      const adminResult = data as { success: boolean; message?: string };
      if (!adminResult.success) {
        throw new Error(adminResult.message || 'Admin setup failed');
      }

      toast.success('Admin account configured successfully!');
      setEmail('');
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Admin setup error:', error);
      toast.error(error.message || 'Failed to setup admin account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Setup Admin Account</DialogTitle>
          <DialogDescription>
            Enter the email address of an existing user account to promote them to admin status.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="admin-email">Email Address</Label>
            <Input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter user email to promote to admin"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSetupAdmin} disabled={isLoading}>
            {isLoading ? 'Setting up...' : 'Setup Admin'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};