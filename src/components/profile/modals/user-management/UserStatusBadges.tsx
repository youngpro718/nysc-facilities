import { Badge } from "@/components/ui/badge";
import { Ban, CheckCircle, Clock, ShieldAlert, AlertTriangle } from "lucide-react";

interface UserStatusBadgesProps {
  verificationStatus: string;
  isApproved: boolean;
  isSuspended?: boolean;
  isAdmin?: boolean;
}

export function UserStatusBadges({ 
  verificationStatus, 
  isApproved, 
  isSuspended,
  isAdmin 
}: UserStatusBadgesProps) {
  const hasIssues = verificationStatus !== 'verified' || !isApproved;

  return (
    <div className="flex gap-2 flex-wrap">
      {/* Suspension Badge - Highest Priority */}
      {isSuspended && (
        <Badge variant="destructive" className="flex items-center gap-1">
          <Ban className="h-3 w-3" />
          Suspended
        </Badge>
      )}

      {/* Admin Badge */}
      {isAdmin && !isSuspended && (
        <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1">
          <ShieldAlert className="h-3 w-3" />
          Admin
        </Badge>
      )}

      {/* Verification Status */}
      {!isSuspended && (
        <>
          {verificationStatus === 'verified' && isApproved && (
            <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Verified
            </Badge>
          )}

          {verificationStatus === 'pending' && (
            <Badge variant="outline" className="text-yellow-700 border-yellow-500 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Pending
            </Badge>
          )}

          {verificationStatus === 'rejected' && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <Ban className="h-3 w-3" />
              Rejected
            </Badge>
          )}

          {!isApproved && verificationStatus !== 'rejected' && (
            <Badge variant="outline" className="text-orange-700 border-orange-500 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Not Approved
            </Badge>
          )}
        </>
      )}

      {/* Issues Indicator */}
      {hasIssues && !isSuspended && (
        <Badge variant="outline" className="text-red-700 border-red-500 text-xs">
          Issues
        </Badge>
      )}
    </div>
  );
}
