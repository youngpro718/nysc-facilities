
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { ConnectionItemProps } from "./types";

export function ConnectionItem({ connection, index, spaceName, onRemove }: ConnectionItemProps) {
  // Helper function to format direction for display
  const formatDirection = (direction: string | undefined) => {
    if (!direction) return null;
    
    // Format the direction to be more readable
    switch (direction) {
      case 'north': return 'North';
      case 'south': return 'South';
      case 'east': return 'East';
      case 'west': return 'West';
      case 'left': return 'Left Side';
      case 'right': return 'Right Side';
      case 'center': return 'Center';
      case 'adjacent': return 'Adjacent to';
      default: return direction.charAt(0).toUpperCase() + direction.slice(1);
    }
  };

  return (
    <Card key={index} className="overflow-hidden">
      <CardContent className="p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {connection.connectionType === 'transition' ? 'Transition Door' : 
             connection.connectionType.charAt(0).toUpperCase() + connection.connectionType.slice(1)}
          </Badge>
          <span className="text-sm">{spaceName}</span>
          {connection.direction && (
            <Badge variant="secondary" className="text-xs">
              {formatDirection(connection.direction)}
            </Badge>
          )}
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => onRemove(index)}
        >
          <X className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
