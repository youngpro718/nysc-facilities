/**
 * CompactHeader - Streamlined greeting header for the user dashboard
 * 
 * Shows:
 * - Time-aware greeting with user's name
 * - Current date
 * - Optional workspace badges (title, room, department)
 */

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { MapPin, Building2, Briefcase } from 'lucide-react';

interface CompactHeaderProps {
  firstName: string;
  lastName?: string;
  title?: string;
  department?: string;
  roomNumber?: string;
  avatarUrl?: string;
  role?: string;
}

export function CompactHeader({
  firstName,
  lastName,
  title,
  department,
  roomNumber,
  avatarUrl,
  role,
}: CompactHeaderProps) {
  const fullName = `${firstName} ${lastName || ''}`.trim();
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  const today = new Date();
  const dayOfWeek = format(today, 'EEEE');
  const formattedDate = format(today, 'MMMM d');
  
  // Get time-based greeting
  const hour = today.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="flex items-center gap-3 sm:gap-4">
      {/* Avatar */}
      <Avatar className="h-12 w-12 sm:h-14 sm:w-14 flex-shrink-0 ring-2 ring-primary/20">
        {avatarUrl && <AvatarImage src={avatarUrl} alt={fullName} />}
        <AvatarFallback className="text-lg bg-primary text-primary-foreground">
          {initials}
        </AvatarFallback>
      </Avatar>
      
      {/* Greeting & Info */}
      <div className="flex-1 min-w-0">
        <h1 className="text-lg sm:text-xl font-semibold tracking-tight truncate">
          {greeting}, {firstName}!
        </h1>
        <p className="text-sm text-muted-foreground">
          {dayOfWeek}, {formattedDate}
        </p>
        
        {/* Workspace badges - only show on larger screens or if minimal */}
        <div className="hidden sm:flex flex-wrap items-center gap-2 mt-1.5">
          {(title || role) && (
            <Badge variant="secondary" className="gap-1 text-xs">
              <Briefcase className="h-3 w-3" />
              {title || role}
            </Badge>
          )}
          
          {department && (
            <Badge variant="outline" className="gap-1 text-xs">
              <Building2 className="h-3 w-3" />
              {department}
            </Badge>
          )}
          
          {roomNumber && (
            <Badge variant="outline" className="gap-1 text-xs">
              <MapPin className="h-3 w-3" />
              Rm {roomNumber}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
