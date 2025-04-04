
import { Badge } from "@/components/ui/badge";
import { HallwayConnection } from "../types/hallwayTypes";

interface ConnectedSpacesProps {
  connections?: HallwayConnection[] | null;
}

export const ConnectedSpaces = ({ connections }: ConnectedSpacesProps) => {
  return (
    <div className="mt-4 space-y-2">
      <p className="text-sm font-medium">Connected Spaces</p>
      <div className="space-y-1">
        {connections?.map((conn) => (
          <div key={conn.id} className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {conn.position || 'Adjacent'}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {conn.to_space?.name || 'Unknown Space'}
            </span>
            {conn.connection_type === 'door' && (
              <Badge variant="secondary" className="text-xs">
                via door
              </Badge>
            )}
          </div>
        ))}
        {(!connections || connections.length === 0) && (
          <p className="text-sm text-muted-foreground">No connected spaces</p>
        )}
      </div>
    </div>
  );
};
