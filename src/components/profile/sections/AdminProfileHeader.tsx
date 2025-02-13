
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Activity, Building2, Globe2, Key, Languages, Shield, UserRound } from "lucide-react";

interface AdminStats {
  activeUsers: number;
  pendingIssues: number;
  totalKeys: number;
  managedBuildings: number;
}

interface EmergencyContact {
  name?: string;
  phone?: string;
  relationship?: string;
}

interface Profile {
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  title?: string;
  department?: string;
  last_login_at?: string;
  bio?: string;
  time_zone?: string;
  language?: string;
  emergency_contact?: EmergencyContact;
}

export function AdminProfileHeader() {
  const [profile, setProfile] = useState<Profile | null>(null);
  
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
        .select('first_name, last_name, avatar_url, title, department, last_login_at, bio, time_zone, language, emergency_contact')
        .eq('id', user.id)
        .single();

      if (profileData) {
        // Cast the emergency_contact to the correct type
        const typedProfileData: Profile = {
          ...profileData,
          emergency_contact: profileData.emergency_contact as EmergencyContact
        };
        setProfile(typedProfileData);
      }

      // Fetch quick stats
      const { count: activeUsersCount } = await supabase
        .from('user_sessions')
        .select('*', { count: 'exact', head: true });

      const { count: pendingIssuesCount } = await supabase
        .from('issues')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'open');

      const { count: totalKeysCount } = await supabase
        .from('keys')
        .select('*', { count: 'exact', head: true });

      const { count: buildingsCount } = await supabase
        .from('buildings')
        .select('*', { count: 'exact', head: true });

      setStats({
        activeUsers: activeUsersCount || 0,
        pendingIssues: pendingIssuesCount || 0,
        totalKeys: totalKeysCount || 0,
        managedBuildings: buildingsCount || 0,
      });

    } catch (error) {
      console.error('Error fetching admin data:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-6 bg-card p-6 rounded-lg">
        <Avatar className="h-20 w-20">
          <AvatarImage src={profile?.avatar_url ?? undefined} />
          <AvatarFallback>
            <UserRound className="h-10 w-10" />
          </AvatarFallback>
        </Avatar>
        <div className="space-y-4 flex-1">
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
          
          {profile?.bio && (
            <p className="text-sm text-muted-foreground">{profile.bio}</p>
          )}

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {profile?.time_zone && (
              <div className="flex items-center gap-1">
                <Globe2 className="h-4 w-4" />
                <span>{profile.time_zone}</span>
              </div>
            )}
            {profile?.language && (
              <div className="flex items-center gap-1">
                <Languages className="h-4 w-4" />
                <span>{profile.language}</span>
              </div>
            )}
          </div>

          {profile?.emergency_contact && (
            <div className="text-sm">
              <p className="font-medium">Emergency Contact</p>
              <div className="text-muted-foreground">
                {profile.emergency_contact.name && <p>Name: {profile.emergency_contact.name}</p>}
                {profile.emergency_contact.phone && <p>Phone: {profile.emergency_contact.phone}</p>}
                {profile.emergency_contact.relationship && <p>Relationship: {profile.emergency_contact.relationship}</p>}
              </div>
            </div>
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
