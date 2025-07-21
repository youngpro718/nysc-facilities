
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { Camera, User, Building2, Briefcase, Shield, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";

export function ProfileHeader() {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    fetchAvatar();
    fetchUserRole();
  }, []);

  const fetchUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      setUserRole(roleData?.role || null);
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  };

  const fetchAvatar = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .single();

      if (profile?.avatar_url) {
        setAvatarUrl(profile.avatar_url);
      }
    } catch (error) {
      console.error('Error fetching avatar:', error);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setIsUploading(true);
      const file = event.target.files?.[0];
      if (!file) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Upload image to Storage
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      toast({
        title: "Success",
        description: "Profile picture updated successfully",
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Error",
        description: "Failed to update profile picture",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const displayName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 'User';
  const hasCompleteName = profile?.first_name && profile?.last_name;

  const getRoleBadgeVariant = (role: string | null) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'supply_room_staff': return 'secondary';
      case 'user': return 'default';
      default: return 'outline';
    }
  };

  const getRoleDisplayName = (role: string | null) => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'supply_room_staff': return 'Supply Room Staff';
      case 'user': return 'User';
      default: return 'Awaiting Role Assignment';
    }
  };

  return (
    <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6 p-6 bg-gradient-to-r from-muted/50 to-muted/30 rounded-lg border">
      <div className="relative group">
        <UserAvatar
          src={avatarUrl || profile?.avatar_url}
          firstName={profile?.first_name || 'U'}
          lastName={profile?.last_name || ''}
          size="xl"
          className="ring-2 ring-primary/20 shadow-lg"
        />
        <label 
          htmlFor="avatar-upload" 
          className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
        >
          <Camera className="h-6 w-6 text-white" />
        </label>
        <input
          id="avatar-upload"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarUpload}
          disabled={isUploading}
        />
      </div>
      
      <div className="flex-1 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold">
              {hasCompleteName ? displayName : (
                <span className="flex items-center gap-2 text-muted-foreground">
                  <AlertCircle className="h-5 w-5" />
                  Complete your name
                </span>
              )}
            </h2>
            <Badge variant={getRoleBadgeVariant(userRole)} className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              {getRoleDisplayName(userRole)}
            </Badge>
          </div>
          
          {profile?.email && (
            <p className="text-muted-foreground">{profile.email}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              <strong>Department:</strong> {(profile as any)?.department || profile?.department_id || (
                <span className="text-muted-foreground italic">Not specified</span>
              )}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              <strong>Title:</strong> {profile?.title || (
                <span className="text-muted-foreground italic">Not specified</span>
              )}
            </span>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          <p>Click the avatar to upload a new profile picture. Recommended size: 256x256px.</p>
        </div>
      </div>
    </div>
  );
}
