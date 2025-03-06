
import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PlusCircle, X, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { type RoomFormData, type RoomConnectionData } from "./RoomFormSchema";

interface ConnectionsFieldProps {
  form: UseFormReturn<RoomFormData>;
  floorId: string;
  roomId?: string;
}

export function ConnectionsField({ form, floorId, roomId }: ConnectionsFieldProps) {
  const [isAddingConnection, setIsAddingConnection] = useState(false);
  const [newConnection, setNewConnection] = useState<RoomConnectionData>({
    toSpaceId: undefined,
    connectionType: undefined,
    direction: undefined
  });

  // Get current connections from form
  const connections = form.watch("connections") || [];

  // Fetch available spaces on the floor
  const { data: spaces, isLoading: isLoadingSpaces } = useQuery({
    queryKey: ["floor-spaces", floorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("new_spaces")
        .select("id, name, type, room_number")
        .eq("floor_id", floorId)
        .eq("status", "active");

      if (error) throw error;
      
      // Filter out the current room
      return (data || []).filter(space => space.id !== roomId);
    },
    enabled: !!floorId
  });

  // Fetch existing connections
  const { data: existingConnections, isLoading: isLoadingConnections } = useQuery({
    queryKey: ["room-connections", roomId],
    queryFn: async () => {
      if (!roomId) return [];
      
      const { data, error } = await supabase
        .from("space_connections")
        .select(`
          id, 
          connection_type,
          direction,
          to_space_id,
          to_space:to_space_id (id, name, type, room_number)
        `)
        .eq("from_space_id", roomId)
        .eq("status", "active");

      if (error) throw error;
      
      return data || [];
    },
    onSuccess: (data) => {
      // Update form with existing connections
      if (data && data.length > 0 && connections.length === 0) {
        const formattedConnections = data.map(conn => ({
          id: conn.id,
          toSpaceId: conn.to_space_id,
          connectionType: conn.connection_type,
          direction: conn.direction
        }));
        
        form.setValue("connections", formattedConnections);
      }
    },
    enabled: !!roomId
  });

  const handleAddConnection = () => {
    if (!newConnection.toSpaceId || !newConnection.connectionType) {
      toast.error("Please select a space and connection type");
      return;
    }

    const updatedConnections = [
      ...connections,
      newConnection
    ];

    form.setValue("connections", updatedConnections);
    setNewConnection({
      toSpaceId: undefined,
      connectionType: undefined,
      direction: undefined
    });
    setIsAddingConnection(false);
    toast.success("Connection added");
  };

  const handleRemoveConnection = (index: number) => {
    const updatedConnections = [...connections];
    updatedConnections.splice(index, 1);
    form.setValue("connections", updatedConnections);
    toast.success("Connection removed");
  };

  const getSpaceName = (spaceId?: string) => {
    if (!spaceId || !spaces) return "Unknown space";
    const space = spaces.find(s => s.id === spaceId);
    if (!space) return "Unknown space";
    
    return space.room_number 
      ? `${space.name} (${space.room_number})`
      : space.name;
  };

  if (isLoadingSpaces || isLoadingConnections) {
    return <div className="py-3">Loading connections...</div>;
  }

  return (
    <FormField
      control={form.control}
      name="connections"
      render={() => (
        <FormItem className="space-y-4">
          <FormLabel>Connected Spaces</FormLabel>
          
          {/* List existing connections */}
          {connections.length > 0 && (
            <div className="space-y-2">
              {connections.map((connection, index) => (
                <Card key={index} className="overflow-hidden">
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {connection.connectionType || "Unknown"}
                      </Badge>
                      <span className="text-sm">{getSpaceName(connection.toSpaceId)}</span>
                      {connection.direction && (
                        <Badge variant="secondary" className="text-xs">
                          {connection.direction}
                        </Badge>
                      )}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleRemoveConnection(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Add new connection UI */}
          {isAddingConnection ? (
            <div className="space-y-3 p-3 border rounded-md">
              <div className="space-y-2">
                <Select
                  value={newConnection.toSpaceId}
                  onValueChange={value => setNewConnection({...newConnection, toSpaceId: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select space to connect to" />
                  </SelectTrigger>
                  <SelectContent>
                    {spaces?.map(space => (
                      <SelectItem key={space.id} value={space.id}>
                        {space.room_number 
                          ? `${space.name} (${space.room_number})`
                          : space.name} ({space.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={newConnection.connectionType}
                  onValueChange={value => setNewConnection({...newConnection, connectionType: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select connection type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="door">Door</SelectItem>
                    <SelectItem value="hallway">Hallway</SelectItem>
                    <SelectItem value="direct">Direct</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={newConnection.direction}
                  onValueChange={value => setNewConnection({...newConnection, direction: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select direction (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="north">North</SelectItem>
                    <SelectItem value="south">South</SelectItem>
                    <SelectItem value="east">East</SelectItem>
                    <SelectItem value="west">West</SelectItem>
                    <SelectItem value="adjacent">Adjacent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 justify-end">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsAddingConnection(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="button" 
                  size="sm"
                  onClick={handleAddConnection}
                >
                  Add Connection
                </Button>
              </div>
            </div>
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
        </FormItem>
      )}
    />
  );
}
