import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { 
  MapPin, 
  Building2,
  Calendar,
  Clock,
  Briefcase
} from 'lucide-react';

interface UserWorkspaceCardProps {
  firstName: string;
  lastName: string;
  title?: string;
  department?: string;
  roomNumber?: string;
  buildingName?: string;
  extension?: string;
  avatarUrl?: string;
  role?: string;
}

export function UserWorkspaceCard({
  firstName,
  lastName,
  title,
  department,
  roomNumber,
  buildingName,
  extension,
  avatarUrl,
  role,
}: UserWorkspaceCardProps) {
  const fullName = `${firstName} ${lastName}`.trim();
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  const today = new Date();
  const dayOfWeek = format(today, 'EEEE');
  const formattedDate = format(today, 'MMMM d, yyyy');
  
  // Get time-based greeting
  const hour = today.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <Card className="bg-gradient-to-br from-primary/5 via-background to-secondary/5 border-primary/20">
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
          {/* Avatar */}
          <Avatar className="h-20 w-20 sm:h-24 sm:w-24 flex-shrink-0 ring-4 ring-primary/20">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={fullName} />}
            <AvatarFallback className="text-2xl bg-primary text-primary-foreground">{initials}</AvatarFallback>
          </Avatar>
          
          {/* User Info */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* Greeting */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                {greeting}, {firstName}!
              </h1>
              <div className="flex items-center gap-2 text-muted-foreground mt-1">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">{dayOfWeek}, {formattedDate}</span>
              </div>
            </div>
            
            {/* Workspace Details */}
            <div className="flex flex-wrap items-center gap-3 text-sm">
              {(title || role) && (
                <Badge variant="secondary" className="gap-1">
                  <Briefcase className="h-3 w-3" />
                  {title || role}
                </Badge>
              )}
              
              {department && (
                <Badge variant="outline" className="gap-1">
                  <Building2 className="h-3 w-3" />
                  {department}
                </Badge>
              )}
              
              {roomNumber && (
                <Badge variant="outline" className="gap-1">
                  <MapPin className="h-3 w-3" />
                  Room {roomNumber}
                </Badge>
              )}
              
              {extension && (
                <Badge variant="outline" className="gap-1 text-muted-foreground">
                  Ext: {extension}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
