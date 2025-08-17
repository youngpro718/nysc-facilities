import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCheck, UserX, Mail, Clock, AlertCircle } from "lucide-react";
import type { User } from "../EnhancedUserManagementModal";

interface PendingUsersSectionProps {
  users: User[];
  loading: boolean;
  onVerify: (userId: string) => void;
  onReject: (userId: string) => void;
}

export function PendingUsersSection({ 
  users, 
  loading, 
  onVerify, 
  onReject 
}: PendingUsersSectionProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <UserCheck className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            No pending verification requests
          </p>
          <p className="text-sm text-muted-foreground text-center mt-2">
            All users have been processed
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-slate-700">
        <AlertCircle className="h-4 w-4" />
        {users.length} user{users.length !== 1 ? 's' : ''} waiting for verification
      </div>
      
      <div className="grid gap-4">
        {users.map((user) => (
          <Card key={user.id} className="border-l-4 border-l-yellow-500">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {user.first_name} {user.last_name}
                    <Badge variant="outline" className="text-yellow-700 border-yellow-500">
                      <Clock className="h-3 w-3 mr-1" />
                      Pending
                    </Badge>
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {user.email}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => onVerify(user.id)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    Verify
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onReject(user.id)}
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <UserX className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Department:</span>
                  <span className="ml-2 text-muted-foreground">
                    {user.department || 'Not specified'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Title:</span>
                  <span className="ml-2 text-muted-foreground">
                    {user.title || 'Not specified'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Requested Access:</span>
                  <span className="ml-2 text-slate-800">
                    {(() => {
                      const raw = (user as any)?.metadata?.requested_access_level as string | undefined;
                      if (!raw) return 'Not specified';
                      return (raw === 'administrative' || raw === 'admin') ? 'Administrative' : 'Standard';
                    })()}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Requested At:</span>
                  <span className="ml-2 text-muted-foreground">
                    {new Date(user.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}