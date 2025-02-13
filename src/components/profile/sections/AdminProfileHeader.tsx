
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Activity, Building2, Key, Shield, UserRound } from "lucide-react";

interface AdminStats {
  activeUsers: number;
  pendingIssues: number;
  totalKeys: number;
  managedBuildings: number;
}

export function AdminProfileHeader() {
  const [profile, setProfile] = useState<{
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
    title?: string;
    department?: string;
    last_login_at?: string;
  } | null>(null);
  const [stats, setStats] = useState<AdminStats>({
    activeUsers: 0,
    pendingIssues: 0,
    totalKeys: 0,
    managedBuildings: 0,
  });

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch profile data
      const { data: profileData } = await supabase
        .from('profiles')
        .select('first_name, last_name, avatar_url, title, department, last_login_at')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      // Fetch quick stats
      const { data: activeUsers } = await supabase
        .from('user_sessions')
        .select('user_id', { count: 'exact', head: true });

      const { data: pendingIssues } = await supabase
        .from('issues')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'open');

      const { data: totalKeys } = await supabase
        .from('keys')
        .select('id', { count: 'exact', head: true });

      const { data: buildings } = await supabase
        .from('buildings')
        .select('id', { count: 'exact', head: true });

      setStats({
        activeUsers: activeUsers?.count || 0,
        pendingIssues: pendingIssues?.count || 0,
        totalKeys: totalKeys?.count || 0,
        managedBuildings: buildings?.count || 0,
      });

    } catch (error) {
      console.error('Error fetching admin data:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-6">
        <Avatar className="h-20 w-20">
          <AvatarImage src={profile?.avatar_url ?? undefined} />
          <AvatarFallback>
            <UserRound className="h-10 w-10" />
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-2xl font-bold">
            {profile?.first_name} {profile?.last_name}
          </h2>
          <div className="text-muted-foreground">
            <p>{profile?.title || 'Administrator'}</p>
            <p>{profile?.department}</p>
          </div>
          {profile?.last_login_at && (
            <p className="text-sm text-muted-foreground mt-1">
              Last login: {new Date(profile.last_login_at).toLocaleString()}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <UserRound className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Active Users</p>
              <p className="text-2xl font-bold">{stats.activeUsers}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Pending Issues</p>
              <p className="text-2xl font-bold">{stats.pendingIssues}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Total Keys</p>
              <p className="text-2xl font-bold">{stats.totalKeys}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Buildings</p>
              <p className="text-2xl font-bold">{stats.managedBuildings}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
