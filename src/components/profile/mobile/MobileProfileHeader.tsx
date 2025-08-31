import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  User, 
  Shield, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Edit3,
  Camera,
  Crown
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { ProfileEditModal } from "@/components/profile/modals/ProfileEditModal";
import { AvatarUploadModal } from "@/components/profile/modals/AvatarUploadModal";

interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  department: string;
  title: string;
  phone: string;
  verification_status: string;
  avatar_url?: string;
  is_admin: boolean;
  created_at: string;
}

export function MobileProfileHeader() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get profile data
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      // Check if admin
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileData) {
        setProfile({
          ...profileData,
          email: user.email || '',
          is_admin: roleData?.role === 'admin'
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        title: "Error loading profile",
        description: "Failed to load profile information",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const getVerificationColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'rejected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <Card className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-muted rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
              <div className="h-3 bg-muted rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card className="p-4">
        <div className="text-center text-muted-foreground">
          Profile not found
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-4">
      {/* Profile Header */}
      <div className="flex items-start gap-4">
        <div className="relative">
          <Avatar className="w-16 h-16">
            <AvatarImage src={profile.avatar_url} />
            <AvatarFallback className="text-lg font-semibold">
              {getInitials(profile.first_name, profile.last_name)}
            </AvatarFallback>
          </Avatar>
          <Button
            size="icon"
            variant="secondary"
            className="absolute -bottom-1 -right-1 w-6 h-6"
            onClick={() => setAvatarModalOpen(true)}
          >
            <Camera className="w-3 h-3" />
          </Button>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="font-semibold text-lg truncate">
              {profile.first_name} {profile.last_name}
            </h2>
            {profile.is_admin && (
              <Crown className="w-4 h-4 text-yellow-500 flex-shrink-0" />
            )}
          </div>
          
          <div className="flex items-center gap-2 mb-2">
            <Badge 
              variant="outline" 
              className={`${getVerificationColor(profile.verification_status)} text-white border-none`}
            >
              {profile.verification_status}
            </Badge>
            {profile.is_admin && (
              <Badge variant="secondary">
                <Shield className="w-3 h-3 mr-1" />
                Admin
              </Badge>
            )}
          </div>

          <div className="text-sm text-muted-foreground space-y-1">
            <div className="flex items-center gap-2">
              <User className="w-3 h-3" />
              <span className="truncate">{profile.title || 'No title'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-3 h-3" />
              <span className="truncate">{profile.email}</span>
            </div>
          </div>
        </div>

        <Button 
          size="icon" 
          variant="ghost"
          onClick={() => setEditModalOpen(true)}
        >
          <Edit3 className="w-4 h-4" />
        </Button>
      </div>

      {/* Contact Information */}
      <div className="space-y-3 pt-2 border-t">
        <h3 className="font-medium text-sm">Contact Information</h3>
        
        <div className="grid gap-3">
          {profile.phone && (
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Phone className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">Phone</div>
                <div className="text-sm text-muted-foreground truncate">
                  {profile.phone}
                </div>
              </div>
            </div>
          )}

          {profile.department && (
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">Department</div>
                <div className="text-sm text-muted-foreground truncate">
                  {profile.department}
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">Member Since</div>
              <div className="text-sm text-muted-foreground">
                {new Date(profile.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ProfileEditModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        profile={profile}
        onProfileUpdate={loadProfile}
      />

      <AvatarUploadModal
        open={avatarModalOpen}
        onOpenChange={setAvatarModalOpen}
        currentAvatarUrl={profile?.avatar_url}
        onAvatarUpdate={loadProfile}
      />
    </Card>
  );
}