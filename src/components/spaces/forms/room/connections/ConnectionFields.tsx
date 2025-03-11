
import { useState } from "react";
import { FormItem, FormLabel } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { RoomConnectionData, ConnectionDirections } from "../RoomFormSchema";
import { SpaceOption } from "./types";
import { Select } from "@/components/ui/select";
import { ConnectionItem } from "./ConnectionItem";
import { NewConnectionForm } from "./NewConnectionForm";

interface ConnectionFieldsProps {
  floorId: string;
  roomId?: string;
  connections: RoomConnectionData[];
  onAddConnection: (connection: RoomConnectionData) => void;
  onRemoveConnection: (index: number) => void;
  spaces?: SpaceOption[];
  isLoading?: boolean;
  connectedSpaceNames?: Record<string, string>;
}

export function ConnectionFields({
  floorId,
  roomId,
  connections,
  onAddConnection,
  onRemoveConnection,
  spaces,
  isLoading,
  connectedSpaceNames = {}
}: ConnectionFieldsProps) {
  const [showNewForm, setShowNewForm] = useState(false);
  
  const handleAddClick = () => {
    setShowNewForm(true);
  };
  
  const handleFormSubmit = (data: RoomConnectionData) => {
    onAddConnection({
      ...data,
      // Ensure direction is valid, default to north if not
      direction: ConnectionDirections.includes(data.direction as any) ? data.direction : "north"
    });
    setShowNewForm(false);
  };
  
  const handleFormCancel = () => {
    setShowNewForm(false);
  };

  return (
    <div className="space-y-4">
      <FormItem>
        <FormLabel>Space Connections</FormLabel>
        
        <div className="space-y-2 mt-2">
          {connections.length > 0 ? (
            <div className="space-y-3">
              {connections.map((connection, index) => (
                <ConnectionItem
                  key={index}
                  index={index}
                  connection={connection}
                  spaceName={connectedSpaceNames[connection.toSpaceId] || "Unknown Space"}
                  onRemove={() => onRemoveConnection(index)}
                />
              ))}
            </div>
          ) : (
            <div className="p-4 border rounded-md text-center text-muted-foreground">
              No connections configured
            </div>
          )}
          
          {!showNewForm && (
            <Button
              type="button"
              variant="outline"
              className="mt-2"
              onClick={handleAddClick}
              disabled={isLoading}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Connection
            </Button>
          )}
          
          {showNewForm && (
            <NewConnectionForm
              floorId={floorId}
              roomId={roomId}
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
              spaces={spaces}
              isLoading={isLoading}
            />
          )}
        </div>
      </FormItem>
    </div>
  );
}
