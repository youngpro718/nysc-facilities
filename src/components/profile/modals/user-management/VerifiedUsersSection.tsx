import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Mail, Users, ArrowUp } from "lucide-react";
import type { User } from "../EnhancedUserManagementModal";

interface VerifiedUsersSectionProps {
  users: User[];
  loading: boolean;
  onPromoteToAdmin: (user: User) => void;
}

export function VerifiedUsersSection({ 
  users, 
  loading, 
  onPromoteToAdmin 
}: VerifiedUsersSectionProps) {
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
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            No verified users found
          </p>
          <p className="text-sm text-muted-foreground text-center mt-2">
            All verified users may have admin privileges
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-slate-700">
        <Users className="h-4 w-4" />
        {users.length} verified user{users.length !== 1 ? 's' : ''} with standard access
      </div>
      
      <div className="grid gap-4">
        {users.map((user) => (
          <Card key={user.id} className="border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {user.first_name} {user.last_name}
                    <Badge className="bg-green-100 text-green-800">
                      Verified
                    </Badge>
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {user.email}
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onPromoteToAdmin(user)}
                  className="border-blue-300 text-blue-600 hover:bg-blue-50"
                >
                  <ArrowUp className="h-4 w-4 mr-2" />
                  Promote to Admin
                </Button>
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
                  <span className="font-medium">Verified:</span>
                  <span className="ml-2 text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString()}
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