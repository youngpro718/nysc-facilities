import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Building2,
  Package,
  Wrench,
  Key
} from 'lucide-react';

interface UserInfoCardProps {
  firstName: string;
  lastName: string;
  email?: string;
  department?: string;
  roomNumber?: string;
  extension?: string;
  avatarUrl?: string;
  supplyRequestsCount?: number;
  openIssuesCount?: number;
  keysHeldCount?: number;
}

export function UserInfoCard({
  firstName,
  lastName,
  email,
  department,
  roomNumber,
  extension,
  avatarUrl,
  supplyRequestsCount = 0,
  openIssuesCount = 0,
  keysHeldCount = 0,
}: UserInfoCardProps) {
  const fullName = `${firstName} ${lastName}`.trim();
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          {/* Left: User Info */}
          <div className="flex items-start gap-4 flex-1">
            <Avatar className="h-16 w-16 flex-shrink-0">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={fullName} />}
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold mb-2">{fullName}</h2>
              
              <div className="space-y-1.5 text-sm text-muted-foreground">
                {department && (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{department}</span>
                    {roomNumber && (
                      <>
                        <span>•</span>
                        <MapPin className="h-4 w-4 flex-shrink-0" />
                        <span>Room {roomNumber}</span>
                      </>
                    )}
                  </div>
                )}
                
                {email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{email}</span>
                  </div>
                )}
                
                {extension && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 flex-shrink-0" />
                    <span>Ext: {extension}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Quick Stats */}
          <div className="grid grid-cols-3 gap-4 md:gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-2xl font-bold">{supplyRequestsCount}</div>
              <div className="text-xs text-muted-foreground">Supply Requests</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Wrench className="h-5 w-5 text-orange-600" />
              </div>
              <div className="text-2xl font-bold">{openIssuesCount}</div>
              <div className="text-xs text-muted-foreground">Open Issues</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Key className="h-5 w-5 text-green-600" />
              </div>
              <div className="text-2xl font-bold">{keysHeldCount}</div>
              <div className="text-xs text-muted-foreground">Keys Held</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
