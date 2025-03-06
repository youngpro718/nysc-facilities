
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
      case 'start_of_hallway': return 'Start of Hallway';
      case 'middle_of_hallway': return 'Middle of Hallway';
      case 'end_of_hallway': return 'End of Hallway';
      case 'left_of_hallway': return 'Left of Hallway';
      case 'right_of_hallway': return 'Right of Hallway';
      default: return direction.charAt(0).toUpperCase() + direction.slice(1);
    }
  };

  return (
    <Card key={index} className="overflow-hidden">
      <CardContent className="p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {connection.connectionType || "Unknown"}
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
