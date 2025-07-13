import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  src?: string | null;
  firstName?: string;
  lastName?: string;
  email?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showFallbackIcon?: boolean;
}

const sizeClasses = {
  sm: 'h-6 w-6 text-xs',
  md: 'h-8 w-8 text-sm',
  lg: 'h-10 w-10 text-base',
  xl: 'h-12 w-12 text-lg'
};

export function UserAvatar({
  src,
  firstName,
  lastName,
  email,
  className,
  size = 'md',
  showFallbackIcon = false
}: UserAvatarProps) {
  const getInitials = () => {
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    if (firstName) {
      return firstName.charAt(0).toUpperCase();
    }
    if (email) {
      return email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      <AvatarImage src={src || undefined} className="object-cover" />
      <AvatarFallback className="font-medium">
        {showFallbackIcon ? (
          <User className={cn(
            size === 'sm' && 'h-3 w-3',
            size === 'md' && 'h-4 w-4',
            size === 'lg' && 'h-5 w-5',
            size === 'xl' && 'h-6 w-6'
          )} />
        ) : (
          getInitials()
        )}
      </AvatarFallback>
    </Avatar>
  );
}