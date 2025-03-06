
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { NewConnectionForm } from "./NewConnectionForm";
import { ConnectionItem } from "./ConnectionItem";
import { RoomConnectionData } from "../RoomFormSchema";
import { ConnectionFieldsProps, SpaceOption } from "./types";

interface ExtendedConnectionFieldsProps extends ConnectionFieldsProps {
  spaces?: SpaceOption[];
  isLoading: boolean;
  connectedSpaceNames: Record<string, string>;
}

export function ConnectionFields({
  floorId,
  roomId,
  connections,
  onAddConnection,
  onRemoveConnection,
  spaces,
  isLoading,
  connectedSpaceNames,
}: ExtendedConnectionFieldsProps) {
  const [isAddingConnection, setIsAddingConnection] = useState(false);
  const [newConnection, setNewConnection] = useState<RoomConnectionData>({
    toSpaceId: undefined,
    connectionType: "doorway",
    direction: "north",
  });

  const handleConnectionChange = (field: keyof RoomConnectionData, value: string) => {
    setNewConnection(prev => ({ ...prev, [field]: value }));
  };

  const handleAddConnection = () => {
    onAddConnection(newConnection);
    setNewConnection({
      toSpaceId: undefined,
      connectionType: "doorway",
      direction: "north",
    });
    setIsAddingConnection(false);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Connections</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {connections.length > 0 ? (
            <div className="space-y-2">
              {connections.map((connection, index) => (
                <ConnectionItem
                  key={index}
                  connection={connection}
                  index={index}
                  spaceName={
                    connection.toSpaceId && connectedSpaceNames[connection.toSpaceId]
                      ? connectedSpaceNames[connection.toSpaceId]
                      : "Unknown Space"
                  }
                  onRemove={onRemoveConnection}
                />
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground py-2">
              No connections added yet.
            </div>
          )}

          {isAddingConnection ? (
            <NewConnectionForm
              spaces={spaces}
              isLoading={isLoading}
              newConnection={newConnection}
              onConnectionChange={handleConnectionChange}
              onAddConnection={handleAddConnection}
              onCancel={() => setIsAddingConnection(false)}
            />
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2"
              onClick={() => setIsAddingConnection(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Connection
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
