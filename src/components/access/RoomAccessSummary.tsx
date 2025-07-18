import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, User, Key, MapPin } from "lucide-react";
import { useRoomAccess, RoomAccessInfo } from "@/hooks/useRoomAccess";
import { format } from "date-fns";

interface RoomAccessSummaryProps {
  roomId: string;
}

export function RoomAccessSummary({ roomId }: RoomAccessSummaryProps) {
  const { data: accessInfo, isLoading, error } = useRoomAccess(roomId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Loading Room Access...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !accessInfo) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <Building2 className="h-8 w-8 mx-auto mb-2" />
          <p>Unable to load room access information</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          {accessInfo.room_name} Access Summary
        </CardTitle>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          Room {accessInfo.room_number} • {accessInfo.building_name} • {accessInfo.floor_name}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Primary Occupants */}
        <div>
          <h3 className="font-medium flex items-center gap-2 mb-3">
            <User className="h-4 w-4" />
            Primary Occupants ({accessInfo.primary_occupants.length})
          </h3>
          {accessInfo.primary_occupants.length === 0 ? (
            <p className="text-sm text-muted-foreground">No primary occupants assigned</p>
          ) : (
            <div className="space-y-2">
              {accessInfo.primary_occupants.map((occupant) => (
                <div key={occupant.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">
                      {occupant.first_name} {occupant.last_name}
                    </div>
                    {occupant.department && (
                      <div className="text-sm text-muted-foreground">{occupant.department}</div>
                    )}
                  </div>
                  <div className="text-right">
                    <Badge variant="default" className="mb-1">Primary</Badge>
                    <div className="text-xs text-muted-foreground">
                      Since {format(new Date(occupant.assigned_at), "MMM d, yyyy")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Secondary Occupants */}
        {accessInfo.secondary_occupants.length > 0 && (
          <div>
            <h3 className="font-medium flex items-center gap-2 mb-3">
              <User className="h-4 w-4" />
              Secondary Occupants ({accessInfo.secondary_occupants.length})
            </h3>
            <div className="space-y-2">
              {accessInfo.secondary_occupants.map((occupant) => (
                <div key={occupant.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">
                      {occupant.first_name} {occupant.last_name}
                    </div>
                    {occupant.department && (
                      <div className="text-sm text-muted-foreground">{occupant.department}</div>
                    )}
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary" className="mb-1">{occupant.assignment_type}</Badge>
                    <div className="text-xs text-muted-foreground">
                      Since {format(new Date(occupant.assigned_at), "MMM d, yyyy")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Key Holders */}
        <div>
          <h3 className="font-medium flex items-center gap-2 mb-3">
            <Key className="h-4 w-4" />
            Key Holders ({accessInfo.key_holders.length})
          </h3>
          {accessInfo.key_holders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No key holders assigned to this room</p>
          ) : (
            <div className="space-y-2">
              {accessInfo.key_holders.map((holder, index) => (
                <div key={`${holder.id}-${index}`} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">
                      {holder.first_name} {holder.last_name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Key: {holder.key_name}
                      {holder.department && ` • ${holder.department}`}
                    </div>
                  </div>
                  <div className="text-right">
                    {holder.is_passkey && (
                      <Badge variant="outline" className="mb-1">Passkey</Badge>
                    )}
                    <div className="text-xs text-muted-foreground">
                      Since {format(new Date(holder.assigned_at), "MMM d, yyyy")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Emergency Contact Info */}
        {accessInfo.primary_occupants.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="font-medium text-sm text-muted-foreground mb-2">Emergency Contact</h4>
            <p className="text-sm">
              Primary: {accessInfo.primary_occupants[0].first_name} {accessInfo.primary_occupants[0].last_name}
              {accessInfo.primary_occupants[0].department && ` (${accessInfo.primary_occupants[0].department})`}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}