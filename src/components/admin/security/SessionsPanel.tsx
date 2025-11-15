import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { signOutOtherSessions } from '@/services/security-settings';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Clock, LogOut, User, Shield } from 'lucide-react';

interface Session {
  user_id: string;
  email: string;
  last_sign_in_at: string | null;
  created_at: string;
}

export default function SessionsPanel() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);

      // For now, just show current session info
      // In production, you'd have a proper sessions table
      if (user) {
        setSessions([{
          user_id: user.id,
          email: user.email || '',
          last_sign_in_at: user.last_sign_in_at || null,
          created_at: user.created_at,
        }]);
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
      toast.error('Failed to load session information');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOutOthers = async () => {
    try {
      await signOutOtherSessions();
      toast.success('All other sessions have been signed out');
      await loadSessions();
    } catch (error) {
      console.error('Failed to sign out other sessions:', error);
      toast.error('Failed to sign out other sessions');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Active Sessions
          </CardTitle>
          <CardDescription>Manage your active login sessions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading sessions...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Active Sessions
        </CardTitle>
        <CardDescription>Manage your active login sessions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {sessions.length === 0 ? (
          <div className="text-sm text-muted-foreground">No active sessions</div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session, index) => (
              <div
                key={session.user_id}
                className="flex items-start justify-between p-3 border rounded-lg"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{session.email}</span>
                    {session.user_id === currentUserId && (
                      <Badge variant="secondary" className="text-xs">
                        Current
                      </Badge>
                    )}
                  </div>
                  {session.last_sign_in_at && (
                    <div className="text-xs text-muted-foreground">
                      Last sign in: {new Date(session.last_sign_in_at).toLocaleString()}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    Created: {new Date(session.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="pt-3 border-t">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleSignOutOthers}
            className="w-full"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out All Other Sessions
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            This will sign out all sessions except your current one
          </p>
        </div>

        <div className="pt-3 border-t">
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <Shield className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <p>
              Session management helps protect your account by allowing you to sign out
              devices you no longer use or don't recognize.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
