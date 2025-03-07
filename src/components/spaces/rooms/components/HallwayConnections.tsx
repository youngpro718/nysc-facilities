
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
import { RoomConnection } from "../types/RoomTypes";

interface HallwayConnectionsProps {
  connections: RoomConnection[];
}

export function HallwayConnections({ connections }: HallwayConnectionsProps) {
  // We'll now identify hallway connections by their target space type
  // rather than relying on direction values that may not be valid
  const hallwayConnections = connections.filter(
    conn => conn.to_space?.type === 'hallway'
  );

  if (hallwayConnections.length === 0) {
    return null;
  }

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
      default:
        return null;
    }
  };

  // Format direction text for display
  const formatDirection = (direction: string | null | undefined) => {
    if (!direction) return '';
    
    // Format the direction to be more readable
    switch (direction) {
      case 'north': return 'North';
      case 'south': return 'South';  
      case 'east': return 'East';
      case 'west': return 'West';
      case 'up': return 'Up';
      case 'down': return 'Down';
      case 'adjacent': return 'Adjacent';
      default: return direction.charAt(0).toUpperCase() + direction.slice(1);
    }
  };

  return (
    <div className="mt-2">
      <p className="text-sm text-muted-foreground mb-2">Hallway Connections:</p>
      <div className="flex flex-wrap gap-2">
        {hallwayConnections.map((conn) => (
          <Badge 
            key={conn.id}
            variant="outline" 
            className="flex items-center text-xs py-1"
          >
            <span>{conn.to_space?.name || 'Hallway'}</span>
            {conn.direction && (
              <div className="flex items-center ml-1">
                <span className="text-[10px]">({formatDirection(conn.direction)})</span>
                {getDirectionIcon(conn.direction)}
              </div>
            )}
          </Badge>
        ))}
      </div>
    </div>
  );
}
