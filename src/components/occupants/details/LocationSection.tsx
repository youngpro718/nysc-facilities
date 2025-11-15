
import { Building2 } from "lucide-react";

interface LocationSectionProps {
  building?: {
    name: string;
  };
  roomNumber?: string;
}

export function LocationSection({ building, roomNumber }: LocationSectionProps) {
  if (!building?.name || !roomNumber) return null;

  return (
    <div className="space-y-4">
      <h3 className="font-medium">Location</h3>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Building2 className="h-4 w-4 flex-shrink-0" />
        <span className="truncate">
          {building.name} - Room {roomNumber}
        </span>
      </div>
    </div>
  );
}
