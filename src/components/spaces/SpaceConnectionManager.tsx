import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link2 } from "lucide-react";
import { ConnectionsList } from "./connections/ConnectionsList";
import { useSpaceConnections } from "./hooks/useSpaceConnections";
import { useAvailableSpaces } from "./hooks/useAvailableSpaces";
import { ConnectionType } from "./connections/types/ConnectionTypes";
import { ConnectedSpacesForm } from "./connections/forms/ConnectedSpacesForm";
import { useToast } from "@/hooks/use-toast";

interface SpaceConnectionManagerProps {
  spaceId: string;
  spaceType: "room" | "hallway" | "door";
}

export function SpaceConnectionManager({ spaceId, spaceType }: SpaceConnectionManagerProps) {
  const [selectedConnectionType, setSelectedConnectionType] = useState<ConnectionType>("room");
  const { toast } = useToast();
  
  const { 
    connections, 
    isLoadingConnections, 
    deleteConnection,
    isDeletingConnection,
    createConnection,
    isCreatingConnection
  } = useSpaceConnections(spaceId, spaceType);

  const { 
    data: availableSpaces, 
    isLoading: isLoadingSpaces 
  } = useAvailableSpaces(spaceId, spaceType, selectedConnectionType);

  const handleSubmit = async (data: any) => {
    try {
      console.log("Submitting connection data:", { spaceId, ...data });
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
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create connection",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (connectionId: string) => {
    try {
      await deleteConnection(connectionId);
    } catch (error) {
      console.error("Error deleting connection:", error);
      toast({
        title: "Error",
        description: "Failed to delete connection",
        variant: "destructive"
      });
    }
  };

  const handleConnectionTypeChange = (type: ConnectionType) => {
    setSelectedConnectionType(type);
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
          isLoading={isLoadingSpaces || isCreatingConnection}
          availableSpaces={availableSpaces || []}
          onConnectionTypeChange={handleConnectionTypeChange}
          selectedConnectionType={selectedConnectionType}
          spaceType={spaceType}
        />

        <div className="border-t pt-4 border-border/40">
          <ConnectionsList
            connections={connections || []}
            isLoading={isLoadingConnections}
            isDeleting={isDeletingConnection}
            onDelete={handleDelete}
            spaceType={spaceType}
          />
        </div>
      </CardContent>
    </Card>
  );
}
