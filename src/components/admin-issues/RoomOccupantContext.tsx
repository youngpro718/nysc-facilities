import { Users, Mail, Crown, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface RoomOccupant {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  is_primary: boolean;
}

interface RoomOccupantContextProps {
  occupants: RoomOccupant[];
}

export function RoomOccupantContext({ occupants }: RoomOccupantContextProps) {
  const primaryOccupant = occupants.find(occ => occ.is_primary);
  const secondaryOccupants = occupants.filter(occ => !occ.is_primary);

  const handleNotifyAll = () => {
    const emails = occupants.map(occ => occ.email).join(',');
    window.open(`mailto:${emails}`);
  };

  return (
    <Card className="p-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Room Occupants</span>
          <Badge variant="outline" className="text-xs">
            {occupants.length}
          </Badge>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleNotifyAll}
          className="h-8 px-2 text-xs"
        >
          <Mail className="h-3 w-3 mr-1" />
          Notify All
        </Button>
      </div>

      <div className="space-y-2">
        {/* Primary Occupant */}
        {primaryOccupant && (
          <div className="flex items-center justify-between p-2 bg-primary/5 rounded">
            <div className="flex items-center gap-2">
              <Crown className="h-3 w-3 text-primary" />
              <div>
                <span className="text-sm font-medium">
                  {primaryOccupant.first_name} {primaryOccupant.last_name}
                </span>
                <p className="text-xs text-muted-foreground">
                  Primary Occupant
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(`mailto:${primaryOccupant.email}`)}
              className="h-8 px-2"
            >
              <Mail className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* Secondary Occupants */}
        {secondaryOccupants.map(occupant => (
          <div key={occupant.id} className="flex items-center justify-between p-2 border rounded">
            <div className="flex items-center gap-2">
              <User className="h-3 w-3 text-muted-foreground" />
              <span className="text-sm">
                {occupant.first_name} {occupant.last_name}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(`mailto:${occupant.email}`)}
              className="h-8 px-2"
            >
              <Mail className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
}