import { User } from "../EnhancedUserManagementModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MoreHorizontal,
  Wrench,
  Lock,
  Unlock,
  Mail,
  Edit,
  ShieldCheck,
  ShieldOff,
  Ban,
  CheckCircle
} from "lucide-react";

interface UserActionsMenuProps {
  user: User;
  onFixAccount: (userId: string) => void;
  onSuspend: (userId: string) => void;
  onUnsuspend: (userId: string) => void;
  onEditProfile: (user: User) => void;
  onResetPassword: (email: string) => void;
  onOverrideVerification: (userId: string) => void;
  onPromoteAdmin?: (user: User) => void;
  onDemoteAdmin?: (user: User) => void;
}

export function UserActionsMenu({
  user,
  onFixAccount,
  onSuspend,
  onUnsuspend,
  onEditProfile,
  onResetPassword,
  onOverrideVerification,
  onPromoteAdmin,
  onDemoteAdmin
}: UserActionsMenuProps) {
  const isSuspended = (user as any).is_suspended;
  const hasIssues = user.verification_status !== 'verified' || !user.is_approved;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Quick Actions</span>
          {hasIssues && (
            <Badge variant="destructive" className="text-xs">Issues</Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {hasIssues && (
          <DropdownMenuItem onClick={() => onFixAccount(user.id)}>
            <Wrench className="mr-2 h-4 w-4" />
            <span>Fix Account Issues</span>
          </DropdownMenuItem>
        )}

        <DropdownMenuItem onClick={() => onEditProfile(user)}>
          <Edit className="mr-2 h-4 w-4" />
          <span>Edit Profile</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => onResetPassword(user.email)}>
          <Mail className="mr-2 h-4 w-4" />
          <span>Send Password Reset</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => onOverrideVerification(user.id)}>
          {user.verification_status === 'verified' ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              <span>Override Verification</span>
            </>
          ) : (
            <>
              <ShieldCheck className="mr-2 h-4 w-4" />
              <span>Force Verify</span>
            </>
          )}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {!user.is_admin && onPromoteAdmin && (
          <DropdownMenuItem onClick={() => onPromoteAdmin(user)}>
            <ShieldCheck className="mr-2 h-4 w-4 text-green-600" />
            <span>Promote to Admin</span>
          </DropdownMenuItem>
        )}

        {user.is_admin && onDemoteAdmin && (
          <DropdownMenuItem onClick={() => onDemoteAdmin(user)}>
            <ShieldOff className="mr-2 h-4 w-4 text-orange-600" />
            <span>Demote from Admin</span>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {isSuspended ? (
          <DropdownMenuItem onClick={() => onUnsuspend(user.id)}>
            <Unlock className="mr-2 h-4 w-4 text-green-600" />
            <span>Unsuspend Account</span>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem 
            onClick={() => onSuspend(user.id)}
            className="text-destructive focus:text-destructive"
          >
            <Ban className="mr-2 h-4 w-4" />
            <span>Suspend Account</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
