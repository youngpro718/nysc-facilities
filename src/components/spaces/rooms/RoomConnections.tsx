
import { Badge } from "@/components/ui/badge";
import { RoomConnection } from "./types/RoomTypes";

interface RoomConnectionsProps {
  connections: RoomConnection[];
}

export function RoomConnections({ connections }: RoomConnectionsProps) {
  // Helper function to format direction for display
  const formatDirection = (direction: string | undefined | null) => {
    if (!direction) return 'Connected';
    
    // Format the direction to be more readable
    switch (direction) {
      case 'start_of_hallway': return 'Start of Hallway';
      case 'middle_of_hallway': return 'Middle of Hallway';
      case 'end_of_hallway': return 'End of Hallway';
      case 'left_of_hallway': return 'Left of Hallway';
      case 'right_of_hallway': return 'Right of Hallway';
      case 'adjacent': return 'Adjacent';
      default: return direction.charAt(0).toUpperCase() + direction.slice(1);
    }
  };

  // Helper function to format connection type for display
  const formatConnectionType = (connectionType: string | undefined | null) => {
    if (!connectionType) return 'Link';
    
    // Format the connection type to be more readable
    switch (connectionType) {
      case 'door': return 'Door';
      case 'opening': return 'Opening';
      case 'hallway': return 'Hallway';
      case 'stairs': return 'Stairs';
      case 'elevator': return 'Elevator';
      default: return connectionType.charAt(0).toUpperCase() + connectionType.slice(1);
    }
  };

  if (!connections || connections.length === 0) {
    return (
      <div className="mt-4 space-y-2">
        <p className="text-sm font-medium">Connected Spaces</p>
        <p className="text-sm text-muted-foreground">No connected rooms</p>
      </div>
    );
  }

  console.log("Connections in RoomConnections:", connections);

  return (
    <div className="mt-4 space-y-2">
      <p className="text-sm font-medium">Connected Spaces</p>
      <div className="space-y-1">
        {connections.map((conn) => (
          <div key={conn.id} className="flex items-center flex-wrap gap-2 p-2 rounded-md bg-muted/40">
            <Badge variant="secondary" className="text-xs">
              {formatConnectionType(conn.connection_type)}
            </Badge>
            {conn.direction && (
              <Badge variant="outline" className="text-xs">
                {formatDirection(conn.direction)}
              </Badge>
            )}
            <span className="text-sm text-muted-foreground ml-auto">
              {conn.to_space?.name || 'Unknown Space'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
