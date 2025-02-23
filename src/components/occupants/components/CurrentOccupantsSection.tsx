
import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface CurrentOccupant {
  id: string;
  first_name: string;
  last_name: string;
  is_primary: boolean;
}

interface CurrentOccupantsSectionProps {
  selectedRoom: string;
  currentOccupants: CurrentOccupant[] | undefined;
  isLoadingOccupants: boolean;
}

export function CurrentOccupantsSection({
  selectedRoom,
  currentOccupants,
  isLoadingOccupants
}: CurrentOccupantsSectionProps) {
  if (!selectedRoom) return null;

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Current Occupants</label>
      <div className="rounded-md border p-4 space-y-2">
        {isLoadingOccupants ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading occupants...
          </div>
        ) : currentOccupants && currentOccupants.length > 0 ? (
          currentOccupants.map((occupant) => (
            <div key={occupant.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span>{occupant.first_name} {occupant.last_name}</span>
              </div>
              {occupant.is_primary && (
                <Badge variant="outline">Primary</Badge>
              )}
            </div>
          ))
        ) : (
          <span className="text-muted-foreground">No current occupants</span>
        )}
      </div>
    </div>
  );
}
