import { ConnectionListItem } from "../ConnectionListItem";
import { Loader2 } from "lucide-react";
import { Connection } from "./types/ConnectionTypes";

interface ConnectionsListProps {
  connections: Connection[];
  isLoading: boolean;
  isDeleting: boolean;
  onDelete: (id: string) => void;
  spaceType: "room" | "hallway" | "door";
}

export function ConnectionsList({
  connections,
  isLoading,
  isDeleting,
  onDelete,
  spaceType
}: ConnectionsListProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!connections?.length) {
    return (
      <div className="text-center py-4 text-muted-foreground text-sm">
        No connections found
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {connections.map((connection) => (
        <ConnectionListItem
          key={connection.id}
          connectionId={connection.id}
          connectedSpaceName={connection.connectedSpaceName}
          connectionType={connection.connectionType}
          isDeleting={isDeleting}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}