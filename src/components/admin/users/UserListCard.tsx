/**
 * UserListCard - Individual user card in the admin user list
 */

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  MoreVertical, 
  Mail, 
  UserX, 
  UserCheck, 
  Ban, 
  CheckCircle, 
  Clock, 
  Unlock 
} from "lucide-react";
import { SYSTEM_ROLES, getRoleLabel, type UserRole } from "@/config/roles";

interface UserProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  title: string | null;
  verification_status: 'pending' | 'verified' | 'rejected';
  is_approved: boolean;
  is_suspended: boolean;
  suspension_reason: string | null;
  created_at: string;
  role?: UserRole;
  department?: { name: string };
}

interface UserListCardProps {
  user: UserProfile;
  currentUserId: string | null;
  updatingUserId: string | null;
  onApprove: (userId: string) => void;
  onReject: (userId: string) => void;
  onUnlock: (email: string) => void;
  onChangeRole: (userId: string, role: UserRole) => void;
  onCopyEmail: (email: string) => void;
}

export function UserListCard({
  user,
  currentUserId,
  updatingUserId,
  onApprove,
  onReject,
  onUnlock,
  onChangeRole,
  onCopyEmail,
}: UserListCardProps) {
  const isCurrentUser = user.id === currentUserId;
  const isUpdating = updatingUserId === user.id;
  const isPending = user.verification_status === 'pending' || !user.is_approved;
  const isVerified = user.verification_status === 'verified' && user.is_approved && !user.is_suspended;

  return (
    <Card className={`p-4 transition-all ${isUpdating ? 'ring-2 ring-primary animate-pulse' : ''}`}>
      <div className="flex items-start gap-4">
        <Avatar className="h-12 w-12">
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {user.first_name?.[0] || user.email[0].toUpperCase()}
            {user.last_name?.[0] || ''}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base truncate">
                {user.first_name && user.last_name 
                  ? `${user.first_name} ${user.last_name}`
                  : user.email
                }
                {isCurrentUser && (
                  <Badge variant="outline" className="ml-2 text-xs">You</Badge>
                )}
              </h3>
              <p className="text-sm text-muted-foreground truncate">{user.email}</p>
              {user.title && (
                <p className="text-sm text-muted-foreground">{user.title}</p>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {isPending && (
                  <>
                    <DropdownMenuItem onClick={() => onApprove(user.id)}>
                      <UserCheck className="h-4 w-4 mr-2" />
                      Approve User
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onReject(user.id)}
                      className="text-red-600"
                    >
                      <UserX className="h-4 w-4 mr-2" />
                      Reject User
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={() => onUnlock(user.email)}>
                  <Unlock className="h-4 w-4 mr-2" />
                  Unlock Account
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onCopyEmail(user.email)}>
                  <Mail className="h-4 w-4 mr-2" />
                  Copy Email
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-2 mt-3">
            <div className="flex flex-wrap gap-2">
              {user.is_suspended ? (
                <Badge variant="destructive" className="gap-1">
                  <Ban className="h-3 w-3" />Suspended
                </Badge>
              ) : isPending ? (
                <Badge variant="secondary" className="gap-1">
                  <Clock className="h-3 w-3" />Pending
                </Badge>
              ) : (
                <Badge variant="default" className="gap-1 bg-green-600">
                  <CheckCircle className="h-3 w-3" />Verified
                </Badge>
              )}
            </div>
            
            {isVerified && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">Role:</span>
                <Select
                  key={`${user.id}-${user.role}`}
                  value={user.role || 'standard'}
                  onValueChange={(value) => onChangeRole(user.id, value as UserRole)}
                  disabled={isCurrentUser || isUpdating}
                >
                  <SelectTrigger className="w-[220px] h-8 text-sm font-medium border-2 hover:border-primary transition-colors">
                    <SelectValue>
                      {isUpdating ? 'Updating...' : getRoleLabel(user.role || 'standard')}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {SYSTEM_ROLES.map((role) => (
                      <SelectItem key={role.value} value={role.value} className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${
                            role.color === 'red' ? 'bg-red-500' :
                            role.color === 'blue' ? 'bg-blue-500' :
                            role.color === 'green' ? 'bg-green-500' :
                            role.color === 'purple' ? 'bg-purple-500' :
                            role.color === 'orange' ? 'bg-orange-500' :
                            'bg-gray-500'
                          }`} />
                          {role.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isCurrentUser && (
                  <span className="text-xs text-muted-foreground italic">(Cannot change your own role)</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
