
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  ArrowRight, 
  ArrowUp, 
  ArrowDown,
  ChevronsLeft,
  ChevronsRight,
  ChevronsUp,
  ChevronsDown
} from "lucide-react";
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
  const formatConnectionType = (connectionType: string) => {
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

  // Get direction icon based on the direction string
  const getDirectionIcon = (direction: string | null | undefined) => {
    if (!direction) return null;
    
    const iconProps = { className: "h-4 w-4 ml-1", strokeWidth: 2 };
    
    switch (direction) {
      case 'north':
      case 'up': 
        return <ArrowUp {...iconProps} />;
      case 'south':
      case 'down': 
        return <ArrowDown {...iconProps} />;
      case 'east':
      case 'right': 
        return <ArrowRight {...iconProps} />;
      case 'west':
      case 'left': 
        return <ArrowLeft {...iconProps} />;
      case 'start_of_hallway': 
        return <ChevronsLeft {...iconProps} />;
      case 'end_of_hallway': 
        return <ChevronsRight {...iconProps} />;
      case 'middle_of_hallway': 
        return <ChevronsDown {...iconProps} />;
      default:
        return null;
    }
  };

  if (!connections || connections.length === 0) {
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium">Connected Spaces</p>
        <p className="text-sm text-muted-foreground">No connected rooms</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Connected Spaces</p>
      <div className="space-y-1">
        {connections.map((conn) => (
          <div key={conn.id} className="flex items-center flex-wrap gap-2 p-2 rounded-md bg-muted/40">
            <Badge variant="secondary" className="text-xs">
              {formatConnectionType(conn.connection_type)}
            </Badge>
            {conn.direction && (
              <Badge variant="outline" className="text-xs flex items-center">
                {formatDirection(conn.direction)}
                {getDirectionIcon(conn.direction)}
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
