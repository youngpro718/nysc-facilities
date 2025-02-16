
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link2 } from "lucide-react";
import { ConnectionsList } from "./connections/ConnectionsList";
import { useSpaceConnections } from "./hooks/useSpaceConnections";
import { useAvailableSpaces } from "./hooks/useAvailableSpaces";
import { ConnectionType } from "./connections/types/ConnectionTypes";
import { ConnectedSpacesForm } from "./connections/forms/ConnectedSpacesForm";

interface SpaceConnectionManagerProps {
  spaceId: string;
  spaceType: "room" | "hallway" | "door";
}

export function SpaceConnectionManager({ spaceId, spaceType }: SpaceConnectionManagerProps) {
  const [selectedConnectionType, setSelectedConnectionType] = useState<ConnectionType>("room");
  
  const { 
    connections, 
    isLoadingConnections, 
    deleteConnection,
    isDeletingConnection,
    createConnection
  } = useSpaceConnections(spaceId, spaceType);

  const { 
    data: availableSpaces, 
    isLoading: isLoadingSpaces 
  } = useAvailableSpaces(spaceId, spaceType, selectedConnectionType);

  const handleSubmit = async (data: any) => {
    console.log("Submitting connection data:", { spaceId, ...data });
    try {
      await createConnection({
        spaceId,
        roomId: data.roomId,
        hallwayId: data.hallwayId,
        doorId: data.doorId,
        direction: data.direction,
        connectionType: data.connectionType,
        position: data.position
      });
    } catch (error) {
      console.error("Error creating connection:", error);
    }
  };

  return (
    <Card className="shadow-md border-border/40">
      <CardHeader className="pb-4 space-y-1.5">
        <CardTitle className="text-lg font-medium flex items-center gap-2 text-foreground">
          <Link2 className="h-5 w-5 text-primary" />
          Connected Spaces
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <ConnectedSpacesForm
          onSubmit={handleSubmit}
          isLoading={isLoadingSpaces}
          availableSpaces={availableSpaces || []}
        />

        <div className="border-t pt-4 border-border/40">
          <ConnectionsList
            connections={connections || []}
            isLoading={isLoadingConnections}
            isDeleting={isDeletingConnection}
            onDelete={deleteConnection}
            spaceType={spaceType}
          />
        </div>
      </CardContent>
    </Card>
  );
}
