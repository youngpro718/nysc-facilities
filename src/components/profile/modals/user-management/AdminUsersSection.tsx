import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Mail, Crown, ArrowDown, Lock } from "lucide-react";
import type { User } from "../EnhancedUserManagementModal";

interface AdminUsersSectionProps {
  users: User[];
  loading: boolean;
  currentUserId: string | null;
  onDemoteFromAdmin: (user: User) => void;
}

export function AdminUsersSection({ 
  users, 
  loading, 
  currentUserId,
  onDemoteFromAdmin 
}: AdminUsersSectionProps) {
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
          <Shield className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            No admin users found
          </p>
          <p className="text-sm text-muted-foreground text-center mt-2">
            This is unusual - there should be at least one admin
          </p>
        </CardContent>
      </Card>
    );
  }

  const isLastAdmin = users.length === 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Crown className="h-4 w-4" />
        {users.length} admin user{users.length !== 1 ? 's' : ''} with full system access
      </div>
      
      <div className="grid gap-4">
        {users.map((user) => {
          const isCurrentUser = user.id === currentUserId;
          const canDemote = !isCurrentUser && !isLastAdmin;
          
          return (
            <Card key={user.id} className="border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50/50 to-transparent">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {user.first_name} {user.last_name}
                      <Badge className="bg-blue-100 text-blue-800">
                        <Shield className="h-3 w-3 mr-1" />
                        Admin
                      </Badge>
                      {isCurrentUser && (
                        <Badge variant="outline" className="text-xs">
                          You
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {user.email}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {canDemote ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onDemoteFromAdmin(user)}
                        className="border-red-300 text-red-600 hover:bg-red-50"
                      >
                        <ArrowDown className="h-4 w-4 mr-2" />
                        Remove Admin
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled
                        className="opacity-50"
                      >
                        <Lock className="h-4 w-4 mr-2" />
                        {isCurrentUser ? "Can't remove self" : "Last admin"}
                      </Button>
                    )}
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
                  <div className="col-span-2">
                    <span className="font-medium">Admin since:</span>
                    <span className="ml-2 text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {isLastAdmin && (
                    <div className="col-span-2 text-xs text-amber-600 bg-amber-50 p-2 rounded">
                      ⚠️ This is the last admin user - cannot be demoted
                    </div>
                  )}
                  {isCurrentUser && (
                    <div className="col-span-2 text-xs text-blue-600 bg-blue-50 p-2 rounded">
                      🔒 You cannot remove your own admin privileges
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}