import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserRound } from "lucide-react";
import { Profile } from "../../types";

interface ProfileAvatarProps {
  profile: Profile | null;
}

export function ProfileAvatar({ profile }: ProfileAvatarProps) {
  const initials = profile?.first_name && profile?.last_name
    ? `${profile.first_name[0]}${profile.last_name[0]}`
    : undefined;

  return (
    <Avatar className="h-24 w-24">
      <AvatarImage src={profile?.avatar_url} />
      <AvatarFallback className="text-lg">
        {initials || <UserRound className="h-12 w-12" />}
      </AvatarFallback>
    </Avatar>
  );
}
