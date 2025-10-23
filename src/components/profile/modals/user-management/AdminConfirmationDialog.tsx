import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Shield, ArrowUp, ArrowDown, AlertTriangle } from "lucide-react";
import type { User } from "../EnhancedUserManagementModal";

interface AdminConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  action: 'promote' | 'demote';
  onConfirm: () => void;
}

export function AdminConfirmationDialog({
  open,
  onOpenChange,
  user,
  action,
  onConfirm
}: AdminConfirmationDialogProps) {
  if (!user) return null;

  const isPromotion = action === 'promote';

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {isPromotion ? (
              <>
                <ArrowUp className="h-5 w-5 text-blue-600" />
                Promote to Admin
              </>
            ) : (
              <>
                <ArrowDown className="h-5 w-5 text-red-600" />
                Remove Admin Privileges
              </>
            )}
          </AlertDialogTitle>
          <div className="space-y-4">
            <AlertDialogDescription asChild>
              <p>
                {isPromotion ? (
                  <>
                    You are about to promote <strong>{user.first_name} {user.last_name}</strong> to administrator.
                  </>
                ) : (
                  <>
                    You are about to remove admin privileges from <strong>{user.first_name} {user.last_name}</strong>.
                  </>
                )}
              </p>
            </AlertDialogDescription>
            
            <div className={`p-4 rounded-lg border ${isPromotion ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-start gap-3">
                {isPromotion ? (
                  <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                )}
                <div className="space-y-2">
                  <h4 className={`font-medium ${isPromotion ? 'text-blue-900' : 'text-red-900'}`}>
                    {isPromotion ? 'Admin privileges include:' : 'They will lose access to:'}
                  </h4>
                  <ul className={`text-sm space-y-1 ${isPromotion ? 'text-blue-800' : 'text-red-800'}`}>
                    <li>• User verification and management</li>
                    <li>• Room and key assignments</li>
                    <li>• System configuration</li>
                    <li>• Database backups and reports</li>
                    <li>• All administrative functions</li>
                  </ul>
                </div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              <strong>Email:</strong> {user.email}
            </p>
            
            {!isPromotion && (
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
                <p className="text-amber-800 text-sm">
                  <strong>Warning:</strong> This action will immediately revoke all admin privileges. 
                  The user will only have standard access until promoted again.
                </p>
              </div>
            )}
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={isPromotion ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'}
          >
            {isPromotion ? 'Promote to Admin' : 'Remove Admin Access'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}