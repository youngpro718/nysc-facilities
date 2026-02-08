
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus } from "lucide-react";
import { UserImportExport } from "@/components/users/UserImportExport";
import { Skeleton } from "@/components/ui/skeleton";

export default function Users() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: users, isLoading, refetch } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          occupant_room_assignments:occupant_room_assignments!occupant_room_assignments_occupant_id_fkey(
            id,
            assignment_type,
            is_primary,
            room:rooms(room_number, name)
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const filteredUsers = users?.filter(user =>
    user.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.department?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getVerificationStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-100 dark:bg-green-900/30 text-green-800';
      case 'rejected': return 'bg-red-100 dark:bg-red-900/30 text-red-800';
      default: return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground">
            Manage user accounts, profiles, and room assignments
          </p>
        </div>
        <div className="flex gap-2">
          <UserImportExport users={users} onImportSuccess={() => refetch()} />
          <Button>
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Users ({filteredUsers?.length || 0})</CardTitle>
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-4 w-[150px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUsers?.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 display flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {user.first_name?.[0]}{user.last_name?.[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">
                        {user.first_name} {user.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      {user.department && (
                        <p className="text-xs text-muted-foreground">{user.department}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getVerificationStatusColor(user.verification_status || 'pending')}>
                      {user.verification_status || 'pending'}
                    </Badge>
                    {user.occupant_room_assignments?.length > 0 && (
                      <Badge variant="outline">
                        {user.occupant_room_assignments.length} room{user.occupant_room_assignments.length !== 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
              {filteredUsers?.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No users found matching your search criteria.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
