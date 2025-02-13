
import { Users } from "lucide-react";

interface CurrentOccupant {
  id: string;
  first_name: string;
  last_name: string;
}

interface CurrentOccupantsProps {
  occupants?: CurrentOccupant[];
}

export function CurrentOccupants({ occupants }: CurrentOccupantsProps) {
  if (!occupants || occupants.length === 0) return null;

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Current Occupants</label>
      <div className="rounded-md border p-4 space-y-2">
        {occupants.map((occupant) => (
          <div key={occupant.id} className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span>{occupant.first_name} {occupant.last_name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
