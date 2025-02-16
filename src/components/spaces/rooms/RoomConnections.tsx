
import { Badge } from "@/components/ui/badge";
import { RoomConnection } from "./types/RoomTypes";

interface RoomConnectionsProps {
  connections: RoomConnection[];
}

export function RoomConnections({ connections }: RoomConnectionsProps) {
  if (!connections || connections.length === 0) {
    return (
      <div className="mt-4 space-y-2">
        <p className="text-sm font-medium">Connected Spaces</p>
        <p className="text-sm text-muted-foreground">No connected rooms</p>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-2">
      <p className="text-sm font-medium">Connected Spaces</p>
      <div className="space-y-1">
        {connections.map((conn) => (
          <div key={conn.id} className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {conn.direction}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {conn.to_space?.name || 'Unknown Room'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
