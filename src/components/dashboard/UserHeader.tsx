
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { UserProfile } from "@/types/dashboard";

interface UserHeaderProps {
  profile: UserProfile;
  isMobile: boolean;
  onReportIssue: () => void;
}

export function UserHeader({ profile, isMobile, onReportIssue }: UserHeaderProps) {
  const getInitials = () => {
    const first = profile.first_name?.[0] || '';
    const last = profile.last_name?.[0] || '';
    return (first + last).toUpperCase() || 'U';
  };

  return (
    <div className="mb-4 sm:mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <Avatar className={isMobile ? "h-10 w-10" : "h-16 w-16"}>
            <AvatarImage src={profile.avatar_url} />
            <AvatarFallback>{getInitials()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h1 className={`${isMobile ? 'text-xl' : 'text-3xl'} font-bold tracking-tight truncate`}>
              {profile.first_name ? `${profile.first_name} ${profile.last_name}` : 'My Dashboard'}
            </h1>
            {profile.title && (
              <p className="text-muted-foreground text-xs sm:text-base truncate">
                {profile.title}
              </p>
            )}
          </div>
        </div>
        <Button 
          onClick={onReportIssue}
          size={isMobile ? "sm" : "default"}
          className="w-full sm:w-auto mt-2 sm:mt-0"
        >
          <Plus className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} mr-1.5`} />
          Report Issue
        </Button>
      </div>
      <p className="text-muted-foreground text-xs sm:text-sm border-t mt-3 pt-3">
        View your assignments and reported issues
      </p>
    </div>
  );
}

