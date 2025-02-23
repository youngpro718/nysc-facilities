import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { UserProfile } from "@/types/dashboard";

interface UserHeaderProps {
  profile: UserProfile;
  isMobile: boolean;
}

export function UserHeader({ profile, isMobile }: UserHeaderProps) {
  const getInitials = () => {
    const first = profile.first_name?.[0] || '';
    const last = profile.last_name?.[0] || '';
    return (first + last).toUpperCase() || 'U';
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight">
          Welcome, {profile?.first_name || 'User'}
        </h2>
        <p className="text-muted-foreground">
          {isMobile ? 'Manage your facilities access' : 'Manage your facility access, report issues, and view notifications'}
        </p>
      </div>
    </div>
  );
}

