
import { useState } from "react";
import { useFieldArray, UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X, Loader2 } from "lucide-react";
import { RoomFormData, RoomConnectionData } from "../RoomFormSchema";
import { useSpacesQuery } from "@/components/spaces/hooks/queries/useSpacesQuery";

interface SimpleConnectionsManagerProps {
  form: UseFormReturn<RoomFormData>;
  floorId: string;
  roomId?: string;
}

type DirectionType = "north" | "south" | "east" | "west";

export function SimpleConnectionsManager({ form, floorId, roomId }: SimpleConnectionsManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newConnection, setNewConnection] = useState<Partial<RoomConnectionData>>({
    toSpaceId: "",
    connectionType: "",
    direction: "north" as DirectionType
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "connections"
  });

  const { data: spaces, isLoading } = useSpacesQuery(floorId);
  const availableSpaces = spaces?.filter(space => space.id !== roomId) || [];

  const handleAddConnection = () => {
    if (newConnection.toSpaceId && newConnection.connectionType) {
      append({
        toSpaceId: newConnection.toSpaceId,
        connectionType: newConnection.connectionType,
        direction: (newConnection.direction || "north") as DirectionType
      });
      
      setNewConnection({
        toSpaceId: "",
        connectionType: "",
        direction: "north" as DirectionType
      });
      setIsAdding(false);
    }
  };

  const getSpaceName = (spaceId: string) => {
    const space = availableSpaces.find(s => s.id === spaceId);
    return space ? space.name : "Unknown Space";
  };

  const formatConnectionType = (type: string) => {
    switch (type) {
      case 'door': return 'Door';
      case 'opening': return 'Open Access';
      case 'window': return 'Window';
      case 'restricted': return 'Restricted Access';
      default: return type;
    }
  };

  const formatDirection = (direction: string) => {
    return direction.charAt(0).toUpperCase() + direction.slice(1);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connected Spaces</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing Connections */}
        {fields.length > 0 ? (
          <div className="space-y-2">
            {fields.map((field, index) => {
              const connection = field as RoomConnectionData;
              return (
                <div key={field.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {formatConnectionType(connection.connectionType)}
                    </Badge>
                    <span className="font-medium">{getSpaceName(connection.toSpaceId)}</span>
                    <Badge variant="secondary" className="text-xs">
                      {formatDirection(connection.direction)}
                    </Badge>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-4 text-sm text-muted-foreground">
            No connected spaces. Add a connection below.
          </div>
        )}

        {/* Add New Connection Form */}
        {isAdding ? (
          <div className="border p-4 rounded-lg space-y-4 bg-muted/20">
            <h4 className="font-medium">Add New Connection</h4>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Connected Space</label>
                <Select
                  value={newConnection.toSpaceId}
                  onValueChange={(value) => setNewConnection(prev => ({ ...prev, toSpaceId: value }))}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select space" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoading ? (
                      <div className="flex items-center justify-center p-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading spaces...
                      </div>
                    ) : (
                      availableSpaces.map((space) => (
                        <SelectItem key={space.id} value={space.id}>
                          {space.name} {space.room_number && `(${space.room_number})`}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Connection Type</label>
                <Select
                  value={newConnection.connectionType}
                  onValueChange={(value) => setNewConnection(prev => ({ ...prev, connectionType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="door">Door</SelectItem>
                    <SelectItem value="opening">Open Access</SelectItem>
                    <SelectItem value="window">Window</SelectItem>
                    <SelectItem value="restricted">Restricted Access</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Direction</label>
                <Select
                  value={newConnection.direction}
                  onValueChange={(value: DirectionType) => setNewConnection(prev => ({ ...prev, direction: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select direction" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="north">North</SelectItem>
                    <SelectItem value="south">South</SelectItem>
                    <SelectItem value="east">East</SelectItem>
                    <SelectItem value="west">West</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAdding(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleAddConnection}
                disabled={!newConnection.toSpaceId || !newConnection.connectionType}
              >
                Add Connection
              </Button>
            </div>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsAdding(true)}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Connection
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
