
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Smartphone, Clock, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RoleManagement } from "./RoleManagement";

interface SecuritySectionProps {
  isAdmin?: boolean;
}

export function SecuritySection({ isAdmin = false }: SecuritySectionProps) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [adminEmail, setAdminEmail] = useState("");
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (isAdmin) {
      fetchSessions();
    }
  }, [isAdmin]);

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .order('last_active_at', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('user_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;
      fetchSessions();
      toast.success("Session ended successfully");
    } catch (error) {
      console.error('Error ending session:', error);
      toast.error("Failed to end session");
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail) {
      toast.error("Please enter an email address");
      return;
    }

    try {
      setIsAddingAdmin(true);
      const { error } = await supabase.rpc('add_admin_user', {
        email_to_promote: adminEmail
      });

      if (error) throw error;

      toast.success("Admin user added successfully!");
      setAdminEmail("");
    } catch (error: any) {
      console.error('Error adding admin:', error);
      toast.error(error.message || "Failed to add admin user");
    } finally {
      setIsAddingAdmin(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast.success("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error.message || "Error updating password");
    }
  };

  return (
    <>
    <Card>
      <CardContent className="p-6">
        <div className="space-y-8">
          {/* Password Update Section for all users */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Change Password</h3>
            </div>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              {isAdmin && (
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <Button type="submit">Update Password</Button>
            </form>
          </div>

          {/* Admin-only sections */}
          {isAdmin && (
            <>
              {/* Add Admin Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Add Administrator</h3>
                </div>
                <form onSubmit={handleAddAdmin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="adminEmail">Admin Email</Label>
                    <div className="flex gap-2">
                      <Input
                        id="adminEmail"
                        type="email"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        placeholder="Enter email to promote to admin"
                      />
                      <Button 
                        type="submit" 
                        disabled={isAddingAdmin}
                      >
                        Add Admin
                      </Button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Active Sessions Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Active Sessions</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Manage your active sessions across different devices
                </p>

                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Device</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Last Active</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sessions.map((session) => (
                        <TableRow key={session.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Smartphone className="h-4 w-4" />
                              <span>{session.device_info?.name || 'Unknown Device'}</span>
                            </div>
                          </TableCell>
                          <TableCell>{session.location || 'Unknown'}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span>
                                {new Date(session.last_active_at).toLocaleDateString()}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleEndSession(session.id)}
                            >
                              End Session
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {sessions.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground">
                            No active sessions found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
    
    {/* Role Management Section */}
    <RoleManagement />
    </>
  );
}
