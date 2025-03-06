
import { FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { RoomConnectionData } from "../../room/RoomFormSchema";
import { ConnectionItem } from "./ConnectionItem";
import { NewConnectionForm } from "./NewConnectionForm";
import { useConnections } from "./useConnections";
import { ConnectionFieldsProps } from "./types";

export function ConnectionFields({ 
  floorId, 
  roomId,
  connections, 
  onAddConnection, 
  onRemoveConnection 
}: ConnectionFieldsProps) {
  const {
    spaces,
    isAddingConnection,
    setIsAddingConnection,
    newConnection,
    isLoadingSpaces,
    getSpaceName,
    handleConnectionChange,
    validateConnection,
    resetConnectionForm
  } = useConnections(floorId, roomId);

  const handleAddConnection = () => {
    if (!validateConnection()) return;
    
    onAddConnection(newConnection);
    resetConnectionForm();
    toast.success("Connection added");
  };

  return (
    <div className="space-y-4">
      <FormLabel>Connected Spaces</FormLabel>
      
      {connections.length > 0 && (
        <div className="space-y-2">
          {connections.map((connection, index) => (
            <ConnectionItem
              key={index}
              connection={connection}
              index={index}
              spaceName={getSpaceName(connection.toSpaceId)}
              onRemove={onRemoveConnection}
            />
          ))}
        </div>
      )}

      {isAddingConnection ? (
        <NewConnectionForm
          spaces={spaces}
          isLoading={isLoadingSpaces}
          newConnection={newConnection}
          onConnectionChange={handleConnectionChange}
          onAddConnection={handleAddConnection}
          onCancel={() => setIsAddingConnection(false)}
        />
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => setIsAddingConnection(true)}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Connection
        </Button>
      )}
    </div>
  );
}
