
import { useEffect, useState } from "react";
import { useFieldArray } from "react-hook-form";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { ConnectionItem } from "./ConnectionItem";
import { NewConnectionForm } from "./NewConnectionForm";
import { useSpacesQuery } from "@/components/spaces/hooks/queries/useSpacesQuery";
import { ConnectionFieldsProps, SpaceOption } from "./types";
import { RoomConnectionData } from "../RoomFormSchema";

export function ConnectionsField({ form, floorId, roomId }: ConnectionFieldsProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [connectedSpaceNames, setConnectedSpaceNames] = useState<Record<string, string>>({});
  
  // Use field array from react-hook-form to manage connections
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "connections"
  });
  
  // Fetch spaces for the selected floor
  const { data: spaces, isLoading } = useSpacesQuery({ floorId });
  
  // Filter out the current room to prevent self-connection
  const availableSpaces = spaces?.filter(space => 
    space.id !== roomId
  ) || [];
  
  // When spaces data loads, build a map of names for display
  useEffect(() => {
    if (spaces && spaces.length > 0) {
      const spaceNames: Record<string, string> = {};
      spaces.forEach(space => {
        spaceNames[space.id] = space.name;
      });
      setConnectedSpaceNames(spaceNames);
    }
  }, [spaces]);
  
  const handleAddConnection = (newConnection: RoomConnectionData) => {
    append(newConnection);
    setIsAdding(false);
  };
  
  const handleRemoveConnection = (index: number) => {
    remove(index);
  };
  
  // Helper to get the space name from its ID
  const getSpaceName = (spaceId: string) => {
    return connectedSpaceNames[spaceId] || "Unknown Space";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">Connected Spaces</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.length > 0 ? (
          <div className="space-y-2">
            {fields.map((field, index) => (
              <ConnectionItem
                key={field.id}
                connection={field as RoomConnectionData}
                spaceName={getSpaceName(field.toSpaceId)}
                onRemove={() => handleRemoveConnection(index)}
                index={index}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-sm text-muted-foreground">
            No connected spaces. Add a connection below.
          </div>
        )}
        
        {isAdding ? (
          <NewConnectionForm
            floorId={floorId}
            roomId={roomId}
            spaces={availableSpaces}
            isLoading={isLoading}
            onSubmit={handleAddConnection}
            onCancel={() => setIsAdding(false)}
          />
        ) : null}
      </CardContent>
      
      <CardFooter>
        {!isAdding && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Connection
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
